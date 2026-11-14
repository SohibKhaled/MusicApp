#!/usr/bin/env python3
"""
VIBE Studio — High-Reliability Local & Multi-Source Streaming Audio Server.
Supports parallel multi-source search (JioSaavn, Audius, SoundCloud, iTunes/Deezer metadata enrichment),
automatic source failover resolution, atomic range-aware audio proxying, HLS rewriting,
and bfcache-safe HTTP headers.
"""

from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import html
import json
import mimetypes
import os
from pathlib import Path
import re
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / "music" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

ALLOWED_PROXY_SUFFIXES = (
    ".saavncdn.com",
    ".jiosaavn.com",
    ".soundcloud.com",
    ".sndcdn.com",
    ".soundcloud.cloud",
    ".r2.cloudflarestorage.com",
    ".audius.co",
    ".audius-creator.net",
    ".cloudfront.net",
    ".akamaized.net",
    ".mzstatic.com",
    ".dzcdn.net",
)

# Thread-safe caches
CACHE_LOCK = threading.Lock()
RESOLVED_STREAM_CACHE: dict[str, tuple[str, float]] = {}
SEARCH_CACHE: dict[str, tuple[dict, float]] = {}
YDL_LOCK = threading.Lock()

STREAM_TTL_SECONDS = 2400  # 40 min
SEARCH_TTL_SECONDS = 300   # 5 min
MAX_DISK_CACHE_BYTES = 350 * 1024 * 1024  # 350 MB cap for online disk cache

SSL_CTX = ssl.create_default_context()

# Extra MIME types
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("audio/mp4", ".m4a")
mimetypes.add_type("audio/mp4", ".mp4")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("audio/aac", ".aac")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/vnd.apple.mpegurl", ".m3u8")

# ---------------------------------------------------------------------------
# Pure-Python DES-ECB Decryption (for JioSaavn encrypted_media_url)
# Zero subprocess overhead, resilient to OpenSSL 3.x legacy cipher removal.
# ---------------------------------------------------------------------------
_IP = [
    58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
]
_FP = [
    40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
]
_E = [
    32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11,
    12, 13, 12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21,
    22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
]
_P = [
    16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
    2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
]
_PC1 = [
    57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
]
_PC2 = [
    14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4,
    26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40,
    51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32,
]
_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]
_SBOX = [
    [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
        [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
        [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
        [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
    ],
    [
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
        [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
        [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
        [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
    ],
    [
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
        [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
        [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
        [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
    ],
    [
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
        [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
        [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
        [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
    ],
    [
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
        [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
        [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
        [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
    ],
    [
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
        [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
        [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
        [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
    ],
    [
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
        [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
        [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
        [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
    ],
    [
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
        [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
        [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
        [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
    ],
]


def _permute(val: int, table: list[int], width: int) -> int:
    res = 0
    for pos in table:
        res = (res << 1) | ((val >> (width - pos)) & 1)
    return res


def _build_des_subkeys(key_bytes: bytes) -> list[int]:
    k64 = int.from_bytes(key_bytes, "big")
    k56 = _permute(k64, _PC1, 64)
    c = (k56 >> 28) & 0xFFFFFFF
    d = k56 & 0xFFFFFFF
    subkeys = []
    for s in _SHIFTS:
        c = ((c << s) | (c >> (28 - s))) & 0xFFFFFFF
        d = ((d << s) | (d >> (28 - s))) & 0xFFFFFFF
        subkeys.append(_permute((c << 28) | d, _PC2, 56))
    return subkeys


_SAAVN_SUBKEYS = _build_des_subkeys(b"38346591")


def _des_decrypt_block(block8: bytes, subkeys: list[int]) -> bytes:
    val = int.from_bytes(block8, "big")
    perm = _permute(val, _IP, 64)
    left = (perm >> 32) & 0xFFFFFFFF
    right = perm & 0xFFFFFFFF
    for sk in reversed(subkeys):
        expanded = _permute(right, _E, 32) ^ sk
        s_out = 0
        for i in range(8):
            chunk = (expanded >> (42 - i * 6)) & 0x3F
            row = ((chunk >> 4) & 2) | (chunk & 1)
            col = (chunk >> 1) & 0x0F
            s_out = (s_out << 4) | _SBOX[i][row][col]
        f_res = _permute(s_out, _P, 32)
        left, right = right, left ^ f_res
    combined = (right << 32) | left
    return _permute(combined, _FP, 64).to_bytes(8, "big")


def decrypt_saavn_url(enc_url: str) -> str:
    """Decrypt JioSaavn DES-ECB encrypted media URL cleanly in pure Python."""
    if not enc_url:
        return ""
    try:
        raw = base64.b64decode(enc_url.strip())
        if len(raw) % 8 != 0 or not raw:
            return ""
        out = bytearray()
        for i in range(0, len(raw), 8):
            out.extend(_des_decrypt_block(raw[i : i + 8], _SAAVN_SUBKEYS))
        pad = out[-1]
        if 1 <= pad <= 8 and all(b == pad for b in out[-pad:]):
            out = out[:-pad]
        url = out.decode("utf-8", errors="ignore").strip()
        if url.startswith("http"):
            return url
    except Exception:
        pass
    # Fallback to OpenSSL with legacy provider if needed
    try:
        p = subprocess.run(
            [
                "openssl", "enc", "-des-ecb", "-K", "3338333436353931",
                "-d", "-a", "-A", "-provider", "legacy", "-provider", "default",
            ],
            input=enc_url.encode("utf-8"),
            capture_output=True,
            timeout=2,
        )
        url = p.stdout.decode("utf-8", errors="ignore").strip()
        return url if url.startswith("http") else ""
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Normalization, Filtering & Metadata Helpers
# ---------------------------------------------------------------------------
ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
NON_WORD_RE = re.compile(r"[^\w\u0600-\u06FF]+", re.UNICODE)
EDIT_KEYWORDS = (
    "slowed", "reverb", "nightcore", "8d", "karaoke", "instrumental",
    "sped up", "speed up", "chipmunk", "bass boosted", "cover", "live ",
    "reaction", "tutorial", "podcast", "interview", "snippet", "teaser",
    "unreleased", "remix", "mashup", "bootleg", "lo-fi", "lofi", "ringtone",
    "بطيئ", "ريمكس", "ريميكس", "كفر", "تقليد", "مهرجان ميكس", "حفلة",
)


def normalize_text(text: str) -> str:
    if not text:
        return ""
    t = html.unescape(text).lower().strip()
    t = re.sub(r"[\u064B-\u065F\u0670]", "", t)  # remove Arabic tashkeel
    t = t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    t = t.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    t = NON_WORD_RE.sub(" ", t).strip()
    return re.sub(r"\s+", " ", t)


def canonical_key(title: str, artist: str) -> str:
    t = re.sub(r"[\(\[\{].*?[\)\]\}]", "", title or "")
    a = re.sub(r"[\(\[\{].*?[\)\]\}]", "", artist or "")
    nt = normalize_text(t).replace(" ", "")
    na = normalize_text(a).replace(" ", "")
    # Use title + first artist token for tight cross-source grouping
    return f"{nt[:28]}|{na[:16]}"


def is_clean_original(title: str, artist: str, raw_query: str) -> bool:
    hay = f"{title} {artist}".lower()
    q_low = raw_query.lower()
    for kw in EDIT_KEYWORDS:
        if kw in hay and kw.strip() not in q_low:
            return False
    return True


def is_allowed_remote_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        host = (parsed.hostname or "").lower()
        return any(host == suf.lstrip(".") or host.endswith(suf) for suf in ALLOWED_PROXY_SUFFIXES)
    except Exception:
        return False


def make_proxy_url(remote_url: str) -> str:
    return "/api/stream?url=" + urllib.parse.quote(remote_url, safe="")


def fetch_json(url: str, timeout: float = 4.5) -> dict | list | None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/plain, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


# ---------------------------------------------------------------------------
# Search Providers (Parallel Multi-Source + Automatic Metadata Transliteration)
# ---------------------------------------------------------------------------
def search_jiosaavn(query: str, limit: int = 8) -> list[dict]:
    results = []
    try:
        q_enc = urllib.parse.quote(query)
        url = (
            "https://www.jiosaavn.com/api.php?__call=search.getResults"
            f"&_format=json&_marker=0&api_version=4&ctx=web6dot0&n={limit}&q={q_enc}"
        )
        data = fetch_json(url, timeout=4.2)
        if not isinstance(data, dict):
            return []
        for item in data.get("results", []):
            more = item.get("more_info") or {}
            enc = more.get("encrypted_media_url", "")
            raw_url = decrypt_saavn_url(enc)
            if not raw_url:
                continue
            # Prefer 160kbps balance of speed & crisp AAC audio; fall back cleanly to 96/320
            hq_url = raw_url.replace("_96.mp4", "_160.mp4") if "_96.mp4" in raw_url else raw_url
            cover = (item.get("image") or "").replace("150x150", "500x500").replace("http://", "https://")
            title = html.unescape(item.get("title") or "").strip()
            artist_raw = ""
            if isinstance(more.get("artistMap"), dict):
                pm = more["artistMap"].get("primary_artists") or more["artistMap"].get("artists") or []
                artist_raw = ", ".join(a.get("name", "") for a in pm[:2] if a.get("name"))
            if not artist_raw:
                artist_raw = more.get("singers") or more.get("music") or item.get("subtitle") or ""
            artist = html.unescape(artist_raw.split(" - ")[0] or "Studio Artist").strip()
            try:
                dur = int(more.get("duration") or 0)
            except (TypeError, ValueError):
                dur = 0
            if dur and (dur < 45 or dur > 900):
                continue
            proxy = make_proxy_url(hq_url)
            backup_proxy = make_proxy_url(raw_url) if raw_url != hq_url else ""
            results.append({
                "id": f"sv_{item.get('id', hashlib.md5(hq_url.encode()).hexdigest()[:10])}",
                "title": title,
                "artist": artist,
                "cover": cover,
                "duration": dur,
                "streamUrl": proxy,
                "fallbackStreams": [u for u in (backup_proxy,) if u],
                "source": "jiosaavn",
                "sourceLabel": "Studio AAC",
                "category": "Online Stream",
                "tag": "online",
                "isLocal": False,
                "isOnline": True,
                "isProgressive": True,
                "priority": 100,
            })
    except Exception as exc:
        print(f"[search_jiosaavn] {query}: {exc}")
    return results


def search_audius(query: str, limit: int = 6) -> list[dict]:
    results = []
    try:
        q_enc = urllib.parse.quote(query)
        url = f"https://discoveryprovider.audius.co/v1/tracks/search?query={q_enc}&limit={limit}&app_name=VIBE"
        data = fetch_json(url, timeout=4.0)
        items = data.get("data", []) if isinstance(data, dict) else []
        for tr in items:
            tid = tr.get("id")
            if not tid:
                continue
            dur = int(tr.get("duration") or 0)
            if dur < 45 or dur > 900:
                continue
            title = (tr.get("title") or "").strip()
            artist = ((tr.get("user") or {}).get("name") or "Audius Artist").strip()
            artwork = tr.get("artwork") or {}
            cover = artwork.get("480x480") or artwork.get("150x150") or ""
            stream_ep = f"https://discoveryprovider.audius.co/v1/tracks/{tid}/stream?app_name=VIBE"
            proxy = make_proxy_url(stream_ep)
            results.append({
                "id": f"aud_{tid}",
                "title": title,
                "artist": artist,
                "cover": cover,
                "duration": dur,
                "streamUrl": proxy,
                "fallbackStreams": [],
                "source": "audius",
                "sourceLabel": "Audius MP3",
                "category": "Online Stream",
                "tag": "online",
                "isLocal": False,
                "isOnline": True,
                "isProgressive": True,
                "priority": 90,
            })
    except Exception as exc:
        print(f"[search_audius] {query}: {exc}")
    return results


def search_soundcloud(query: str, limit: int = 8) -> list[dict]:
    if not yt_dlp:
        return []
    results = []
    try:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": True,
            "socket_timeout": 4,
        }
        with YDL_LOCK:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(f"scsearch{limit}:{query}", download=False)
        entries = (info or {}).get("entries") or []
        for entry in entries:
            if not entry:
                continue
            sc_url = entry.get("url") or entry.get("webpage_url") or ""
            if not sc_url:
                continue
            dur = int(entry.get("duration") or 0)
            # Filter out known 30s Go+ previews at index stage
            if dur > 0 and (dur < 45 or dur > 900):
                continue
            title = (entry.get("title") or "Unknown Track").strip()
            artist = (entry.get("uploader") or entry.get("channel") or "SoundCloud").strip()
            sc_id = str(entry.get("id") or hashlib.md5(sc_url.encode()).hexdigest()[:12])
            thumbs = entry.get("thumbnails") or []
            cover = entry.get("thumbnail") or (thumbs[-1].get("url") if thumbs else "")
            if isinstance(cover, str) and "-large." in cover:
                cover = cover.replace("-large.", "-t500x500.")
            stream_url = (
                f"/api/stream?id={urllib.parse.quote(sc_id, safe='')}"
                f"&sc={urllib.parse.quote(sc_url, safe='')}"
                f"&title={urllib.parse.quote(title, safe='')}"
                f"&artist={urllib.parse.quote(artist, safe='')}"
            )
            results.append({
                "id": f"sc_{sc_id}",
                "title": title,
                "artist": artist,
                "cover": cover or "",
                "duration": dur,
                "streamUrl": stream_url,
                "fallbackStreams": [],
                "source": "soundcloud",
                "sourceLabel": "SoundCloud",
                "category": "Online Stream",
                "tag": "online",
                "isLocal": False,
                "isOnline": True,
                "isProgressive": False,
                "priority": 75,
            })
    except Exception as exc:
        print(f"[search_soundcloud] {query}: {exc}")
    return results


def fetch_itunes_hints(query: str) -> list[dict]:
    """Fast official catalog metadata from iTunes to transliterate Arabic queries & verify covers."""
    hints = []
    try:
        q_enc = urllib.parse.quote(query)
        data = fetch_json(
            f"https://itunes.apple.com/search?term={q_enc}&entity=song&limit=5",
            timeout=3.2,
        )
        for item in (data or {}).get("results", []):
            title = (item.get("trackName") or "").strip()
            artist = (item.get("artistName") or "").strip()
            cover = (item.get("artworkUrl100") or "").replace("100x100bb", "500x500bb")
            dur = int((item.get("trackTimeMillis") or 0) / 1000)
            if title and artist:
                hints.append({
                    "title": title,
                    "artist": artist,
                    "cover": cover,
                    "duration": dur,
                    "previewUrl": item.get("previewUrl") or "",
                })
    except Exception:
        pass
    return hints


def resolve_soundcloud_stream(sc_url: str, title: str = "", artist: str = "") -> tuple[str, bool]:
    """Resolve SoundCloud URL to best playable format, rejecting 30s previews when a full source exists."""
    now = time.time()
    with CACHE_LOCK:
        cached = RESOLVED_STREAM_CACHE.get(sc_url)
        if cached and now - cached[1] < STREAM_TTL_SECONDS:
            return cached[0], False

    if not yt_dlp:
        return "", False

    best_url = ""
    only_preview = False
    try:
        opts = {"quiet": True, "no_warnings": True, "skip_download": True, "socket_timeout": 5}
        with YDL_LOCK:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(sc_url, download=False)
        formats = (info or {}).get("formats") or []
        full_prog = []
        full_hls = []
        previews = []
        for f in formats:
            u = f.get("url")
            if not u:
                continue
            fid = (f.get("format_id") or "").lower()
            proto = (f.get("protocol") or "").lower()
            abr = f.get("abr") or 0
            if "preview" in fid:
                previews.append((abr, u))
            elif proto in ("http", "https"):
                full_prog.append((abr, u))
            else:
                full_hls.append((abr, u))

        if full_prog:
            full_prog.sort(key=lambda x: x[0], reverse=True)
            best_url = full_prog[0][1]
        elif full_hls:
            full_hls.sort(key=lambda x: x[0], reverse=True)
            best_url = full_hls[0][1]
        elif previews:
            only_preview = True
            previews.sort(key=lambda x: x[0], reverse=True)
            best_url = previews[0][1]
        elif info and info.get("url"):
            best_url = info["url"]
    except Exception as exc:
        print(f"[resolve_sc] err for {sc_url}: {exc}")

    # If SoundCloud gave only a 30s Go+ preview and we know title+artist, rescue with full JioSaavn/Audius!
    if (only_preview or not best_url) and title:
        q = f"{title} {artist}".strip()
        for sv in search_jiosaavn(q, limit=3):
            raw_sv = urllib.parse.parse_qs(urllib.parse.urlparse(sv["streamUrl"]).query).get("url", [""])[0]
            if raw_sv:
                with CACHE_LOCK:
                    RESOLVED_STREAM_CACHE[sc_url] = (raw_sv, time.time())
                return raw_sv, False
        for aud in search_audius(q, limit=2):
            raw_aud = urllib.parse.parse_qs(urllib.parse.urlparse(aud["streamUrl"]).query).get("url", [""])[0]
            if raw_aud:
                with CACHE_LOCK:
                    RESOLVED_STREAM_CACHE[sc_url] = (raw_aud, time.time())
                return raw_aud, False

    if best_url:
        with CACHE_LOCK:
            RESOLVED_STREAM_CACHE[sc_url] = (best_url, time.time())
    return best_url, only_preview


def smart_search(query: str, mode: str = "original") -> dict:
    """Parallel multi-source search with Arabic transliteration rescue & cross-source fallback bundling."""
    t_start = time.time()
    q = query.strip()
    if not q:
        return {"results": [], "total": 0, "queryMs": 0, "sourcesUsed": []}

    cache_key = f"{mode}:{normalize_text(q)}"
    now = time.time()
    with CACHE_LOCK:
        hit = SEARCH_CACHE.get(cache_key)
        if hit and now - hit[1] < SEARCH_TTL_SECONDS:
            return hit[0]

    has_arabic = bool(ARABIC_RE.search(q))
    saavn_res: list[dict] = []
    audius_res: list[dict] = []
    sc_res: list[dict] = []
    itunes_hints: list[dict] = []

    with ThreadPoolExecutor(max_workers=4) as pool:
        f_saavn = pool.submit(search_jiosaavn, q, 8)
        f_audius = pool.submit(search_audius, q, 6)
        f_sc = pool.submit(search_soundcloud, q, 8)
        f_itunes = pool.submit(fetch_itunes_hints, q)

        saavn_res = f_saavn.result()
        audius_res = f_audius.result()
        sc_res = f_sc.result()
        itunes_hints = f_itunes.result()

    # Wave 2: If Arabic or few Saavn hits, query JioSaavn using iTunes Latin canonical titles!
    extra_queries = []
    if itunes_hints and len(saavn_res) < 3:
        for h in itunes_hints[:2]:
            clean_t = re.sub(r"[\(\[].*?[\)\]]", "", h["title"]).strip()
            clean_a = h["artist"].split(",")[0].strip()
            cand_q = f"{clean_t} {clean_a}".strip()
            if cand_q and normalize_text(cand_q) != normalize_text(q):
                extra_queries.append((cand_q, h.get("cover", "")))

    if extra_queries:
        with ThreadPoolExecutor(max_workers=2) as pool:
            futs = [(pool.submit(search_jiosaavn, cq, 5), cov) for cq, cov in extra_queries]
            for fut, cov in futs:
                for item in fut.result():
                    if not item.get("cover") and cov:
                        item["cover"] = cov
                    saavn_res.append(item)

    # Combine all results, attach high-res cover hints from iTunes if missing
    best_hint_cover = itunes_hints[0]["cover"] if itunes_hints and itunes_hints[0].get("cover") else ""
    all_raw = saavn_res + audius_res + sc_res

    q_norm = normalize_text(q)
    q_tokens = set(q_norm.split())
    grouped: dict[str, dict] = {}
    order: list[str] = []

    for item in all_raw:
        title = item.get("title") or ""
        artist = item.get("artist") or ""
        if mode == "original" and not is_clean_original(title, artist, q):
            continue
        if not item.get("cover") and best_hint_cover:
            item["cover"] = best_hint_cover

        # Score relevance
        hay_norm = normalize_text(f"{title} {artist}")
        hay_tokens = set(hay_norm.split())
        overlap = len(q_tokens & hay_tokens)
        exact_boost = 40 if q_norm and q_norm in hay_norm else 0
        # Progressive MP4/MP3 preferred for mobile lock-screen survival & fast buffering
        prog_boost = 25 if item.get("isProgressive") else 0
        gym_boost = 15 if mode == "gym" and any(w in hay_norm for w in ("phonk", "remix", "bass", "hard", "workout", "gym")) else 0
        score = item.get("priority", 50) + overlap * 18 + exact_boost + prog_boost + gym_boost
        item["_score"] = score

        key = canonical_key(title, artist)
        if not key or key == "|":
            key = item["id"]

        if key not in grouped:
            item["fallbackStreams"] = list(item.get("fallbackStreams") or [])
            grouped[key] = item
            order.append(key)
        else:
            existing = grouped[key]
            # Merge alternate playable streams cleanly onto winner for instant failover!
            if item["_score"] > existing["_score"]:
                fallbacks = [existing["streamUrl"]] + existing.get("fallbackStreams", []) + item.get("fallbackStreams", [])
                if not item.get("cover") and existing.get("cover"):
                    item["cover"] = existing["cover"]
                item["fallbackStreams"] = [u for u in dict.fromkeys(fallbacks) if u and u != item["streamUrl"]][:4]
                grouped[key] = item
            else:
                fallbacks = existing.get("fallbackStreams", []) + [item["streamUrl"]] + item.get("fallbackStreams", [])
                existing["fallbackStreams"] = [u for u in dict.fromkeys(fallbacks) if u and u != existing["streamUrl"]][:4]

    final_list = sorted((grouped[k] for k in order), key=lambda x: x.get("_score", 0), reverse=True)
    for item in final_list:
        item.pop("_score", None)

    sources_used = sorted({item["source"] for item in final_list})
    payload = {
        "results": final_list[:20],
        "total": len(final_list),
        "queryMs": int((time.time() - t_start) * 1000),
        "sourcesUsed": sources_used,
        "hasArabicQuery": has_arabic,
    }
    with CACHE_LOCK:
        SEARCH_CACHE[cache_key] = (payload, time.time())
    return payload


def resolve_fallback_candidates(title: str, artist: str, exclude: str = "") -> list[dict]:
    """Quickly resolve fresh stream URLs across providers when a playing track fails/expires."""
    clean_t = re.sub(r"[\(\[].*?[\)\]]", "", title).strip()
    clean_a = re.sub(r"[\(\[].*?[\)\]]", "", artist).strip()
    q = f"{clean_t} {clean_a}".strip()
    if not q:
        return []
    res = smart_search(q, mode="all").get("results", [])
    candidates = []
    seen = set()
    for item in res[:6]:
        for url in [item.get("streamUrl")] + (item.get("fallbackStreams") or []):
            if not url or url in seen or (exclude and url == exclude):
                continue
            seen.add(url)
            candidates.append({
                "streamUrl": url,
                "sourceLabel": item.get("sourceLabel") or "Backup Stream",
                "cover": item.get("cover") or "",
            })
    return candidates[:6]


def _trim_disk_cache_if_needed() -> None:
    try:
        files = [p for p in CACHE_DIR.iterdir() if p.is_file() and not p.name.endswith(".tmp")]
        total = sum(p.stat().st_size for p in files)
        if total <= MAX_DISK_CACHE_BYTES:
            return
        files.sort(key=lambda p: p.stat().st_mtime)
        for p in files:
            if total <= MAX_DISK_CACHE_BYTES * 0.8:
                break
            sz = p.stat().st_size
            p.unlink(missing_ok=True)
            total -= sz
    except Exception:
        pass


# ---------------------------------------------------------------------------
# HTTP Request Handler with Range 206, Proxy Caching, and Clean Headers
# ---------------------------------------------------------------------------
class VibeHTTPHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def translate_path(self, path: str) -> str:
        clean = urllib.parse.unquote(urllib.parse.urlparse(path).path).lstrip("/")
        target = (BASE_DIR / clean).resolve()
        if not str(target).startswith(str(BASE_DIR)):
            return str(BASE_DIR / "__forbidden__")
        return str(target)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type")
        self.send_header("Accept-Ranges", "bytes")
        # Allow browser bfcache while ensuring fresh updates (modern-web-guidance performance rule)
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        # Quiet clean access logs except non-200 errors
        if args and len(args) >= 2 and str(args[1]).startswith(("4", "5")):
            super().log_message(format, *args)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_request(head_only=True)

    def do_GET(self) -> None:
        self._handle_request(head_only=False)

    def _send_json(self, obj: dict, status: int = 200, head_only: bool = False) -> None:
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def _handle_request(self, head_only: bool = False) -> None:
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            qs = urllib.parse.parse_qs(parsed.query)

            if path == "/favicon.ico":
                self.send_response(HTTPStatus.NO_CONTENT)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return

            if path == "/api/health":
                cached = sum(1 for p in CACHE_DIR.iterdir() if p.is_file() and not p.name.endswith(".tmp"))
                self._send_json({
                    "ok": True,
                    "sources": ["local", "jiosaavn", "audius", "soundcloud", "itunes"],
                    "ytDlpReady": yt_dlp is not None,
                    "cachedFiles": cached,
                }, head_only=head_only)
                return

            if path == "/api/search":
                q = (qs.get("q") or [""])[0].strip()
                mode = (qs.get("mode") or ["original"])[0]
                if not q:
                    self._send_json({"results": [], "total": 0, "queryMs": 0}, head_only=head_only)
                    return
                res = smart_search(q, mode=mode)
                self._send_json(res, head_only=head_only)
                return

            if path == "/api/resolve_fallback":
                title = (qs.get("title") or [""])[0].strip()
                artist = (qs.get("artist") or [""])[0].strip()
                exclude = (qs.get("exclude") or [""])[0].strip()
                cands = resolve_fallback_candidates(title, artist, exclude=exclude)
                self._send_json({"candidates": cands}, head_only=head_only)
                return

            if path == "/api/stream":
                self._handle_stream(qs, head_only=head_only)
                return

            # Static files with clean HTTP 206 Range support for local MP3/M4A playback
            if path in ("", "/"):
                target = BASE_DIR / "index.html"
            else:
                target = Path(self.translate_path(path))

            if target.is_dir():
                target = target / "index.html"

            if not target.exists() or not target.is_file():
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")
                return

            self._serve_local_file_range(target, head_only=head_only)

        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        except Exception as exc:
            print(f"[server] error on {self.path}: {exc}")
            try:
                self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))
            except Exception:
                pass

    def _serve_local_file_range(self, file_path: Path, head_only: bool = False) -> None:
        size = file_path.stat().st_size
        ctype, _ = mimetypes.guess_type(str(file_path))
        if not ctype:
            ctype = "application/octet-stream"

        range_hdr = self.headers.get("Range")
        if range_hdr and range_hdr.startswith("bytes="):
            spec = range_hdr.replace("bytes=", "").strip()
            parts = spec.split("-", 1)
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if parts[1] else size - 1
            if parts[0] == "" and parts[1]:
                # suffix range bytes=-500
                suffix = int(parts[1])
                start = max(0, size - suffix)
                end = size - 1
            end = min(end, size - 1)
            if start >= size or start > end:
                self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            length = end - start + 1
            self.send_response(HTTPStatus.PARTIAL_CONTENT)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.end_headers()
            if head_only:
                return
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(131072, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.end_headers()
        if head_only:
            return
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(131072)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def _handle_stream(self, qs: dict, head_only: bool = False) -> None:
        raw_url = (qs.get("url") or [""])[0]
        sc_url = (qs.get("sc") or [""])[0]
        title = (qs.get("title") or [""])[0]
        artist = (qs.get("artist") or [""])[0]

        target_url = ""
        if sc_url:
            target_url, _ = resolve_soundcloud_stream(sc_url, title=title, artist=artist)
        elif raw_url:
            target_url = raw_url

        if not target_url or not is_allowed_remote_url(target_url):
            self.send_error(HTTPStatus.BAD_GATEWAY, "Unresolvable or disallowed stream URL")
            return

        # Serve from atomic full-file disk cache if present (non-m3u8 progressive tracks only)
        is_m3u8 = ".m3u8" in target_url.lower()
        cache_key = hashlib.md5(target_url.split("?")[0].encode("utf-8")).hexdigest()
        ext = ".m4a" if ".mp4" in target_url or ".m4a" in target_url else ".mp3"
        cached_file = CACHE_DIR / f"{cache_key}{ext}"

        if not is_m3u8 and cached_file.exists() and cached_file.stat().st_size > 8192:
            self._serve_local_file_range(cached_file, head_only=head_only)
            return

        # Proxy request upstream; if SoundCloud cached URL expired (403/404/410), purge and re-resolve once!
        attempts = 2 if sc_url else 1
        for attempt in range(attempts):
            try:
                self._proxy_remote(target_url, cached_file, is_m3u8=is_m3u8, head_only=head_only)
                return
            except urllib.error.HTTPError as he:
                if sc_url and attempt == 0 and he.code in (401, 403, 404, 410):
                    with CACHE_LOCK:
                        RESOLVED_STREAM_CACHE.pop(sc_url, None)
                    target_url, _ = resolve_soundcloud_stream(sc_url, title=title, artist=artist)
                    if target_url:
                        is_m3u8 = ".m3u8" in target_url.lower()
                        continue
                self.send_error(HTTPStatus.BAD_GATEWAY, f"Upstream HTTP {he.code}")
                return
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                return
            except Exception as exc:
                if attempt == 0 and sc_url:
                    with CACHE_LOCK:
                        RESOLVED_STREAM_CACHE.pop(sc_url, None)
                    target_url, _ = resolve_soundcloud_stream(sc_url, title=title, artist=artist)
                    if target_url:
                        continue
                self.send_error(HTTPStatus.BAD_GATEWAY, str(exc))
                return

    def _proxy_remote(
        self,
        target_url: str,
        cached_file: Path,
        is_m3u8: bool,
        head_only: bool,
    ) -> None:
        headers = {"User-Agent": USER_AGENT}
        range_hdr = self.headers.get("Range")
        if range_hdr and not is_m3u8:
            headers["Range"] = range_hdr

        method = "HEAD" if head_only and not is_m3u8 else "GET"
        req = urllib.request.Request(target_url, headers=headers, method=method)

        with urllib.request.urlopen(req, timeout=12, context=SSL_CTX) as resp:
            status = resp.status
            ctype = resp.headers.get("Content-Type") or "application/octet-stream"
            clen = resp.headers.get("Content-Length")
            crange = resp.headers.get("Content-Range")

            # Check if response body is actually HLS playlist
            is_hls = is_m3u8 or "mpegurl" in ctype.lower() or "m3u8" in ctype.lower()
            if is_hls:
                text = resp.read().decode("utf-8", errors="replace")
                rewritten = []
                for line in text.splitlines():
                    s = line.strip()
                    if not s:
                        rewritten.append(line)
                    elif s.startswith("#"):
                        # Also rewrite URI="..." inside #EXT-X-KEY or #EXT-X-MAP
                        def _rep_uri(m):
                            abs_u = urllib.parse.urljoin(target_url, m.group(1))
                            return f'URI="{make_proxy_url(abs_u)}"'
                        rewritten.append(re.sub(r'URI="([^"]+)"', _rep_uri, line))
                    else:
                        abs_u = urllib.parse.urljoin(target_url, s)
                        rewritten.append(make_proxy_url(abs_u))
                out_bytes = ("\n".join(rewritten) + "\n").encode("utf-8")
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                self.send_header("Content-Length", str(len(out_bytes)))
                self.end_headers()
                if not head_only:
                    self.wfile.write(out_bytes)
                return

            if ".mp4" in target_url or ".m4a" in target_url:
                ctype = "audio/mp4"
            elif ".mp3" in target_url and "octet-stream" in ctype:
                ctype = "audio/mpeg"

            self.send_response(status)
            self.send_header("Content-Type", ctype)
            if crange:
                self.send_header("Content-Range", crange)
            if clen:
                self.send_header("Content-Length", clen)
            self.end_headers()

            if head_only:
                return

            # Atomically cache full 200 non-HLS audio files <= 25MB
            should_cache = (
                status == 200
                and not range_hdr
                and (not clen or int(clen) <= 25 * 1024 * 1024)
                and ctype.startswith("audio/")
            )
            tmp_file = CACHE_DIR / f"{cached_file.name}.{threading.get_ident()}.tmp" if should_cache else None
            out_fp = open(tmp_file, "wb") if tmp_file else None
            written = 0
            completed = False

            try:
                while True:
                    chunk = resp.read(131072)
                    if not chunk:
                        completed = True
                        break
                    self.wfile.write(chunk)
                    if out_fp:
                        if written + len(chunk) <= 25 * 1024 * 1024:
                            out_fp.write(chunk)
                            written += len(chunk)
                        else:
                            out_fp.close()
                            out_fp = None
                            tmp_file.unlink(missing_ok=True)
            finally:
                if out_fp:
                    out_fp.close()
                if tmp_file and tmp_file.exists():
                    if completed and written > 8192:
                        try:
                            tmp_file.replace(cached_file)
                            _trim_disk_cache_if_needed()
                        except Exception:
                            tmp_file.unlink(missing_ok=True)
                    else:
                        tmp_file.unlink(missing_ok=True)


def run_server(port: int = 8080) -> None:
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", port), VibeHTTPHandler)
    print(f"VIBE Studio Server running at http://0.0.0.0:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down VIBE Studio Server...")
        server.server_close()


if __name__ == "__main__":
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(p)
