#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes
import json
import urllib.parse
import urllib.request
import subprocess
import base64
import re
import hashlib
import time

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(DIRECTORY, 'music', 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

mimetypes.add_type('audio/mp4', '.m4a')
mimetypes.add_type('audio/mp4', '.mp4')
mimetypes.add_type('audio/mp4', '.m4s')
mimetypes.add_type('audio/mpeg', '.mp3')
mimetypes.add_type('audio/aac', '.aac')
mimetypes.add_type('application/vnd.apple.mpegurl', '.m3u8')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('application/manifest+json', '.webmanifest')

RESOLVED_STREAM_CACHE = {}

def decrypt_saavn(enc_b64):
    try:
        raw = base64.b64decode(enc_b64.strip())
        p = subprocess.Popen(
            ['openssl', 'enc', '-d', '-des-ecb', '-K', '3338333436353931', '-provider', 'legacy', '-provider', 'default'],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        out, _ = p.communicate(input=raw)
        if not out:
            return None
        pad = out[-1]
        if pad < 8:
            out = out[:-pad]
        url = out.decode('utf-8', errors='ignore')
        return url.replace('_96.mp4', '_160.mp4')
    except Exception:
        return None

def fetch_saavn_search(query):
    try:
        url = 'https://www.jiosaavn.com/api.php?__call=search.getResults&q=' + urllib.parse.quote(query) + '&_format=json&_marker=0&api_version=4&ctx=web6dot0'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req, timeout=4) as r:
            data = json.loads(r.read().decode('utf-8'))
            results = []
            for item in data.get('results', []):
                enc = item.get('more_info', {}).get('encrypted_media_url')
                if not enc:
                    continue
                stream_url = decrypt_saavn(enc)
                if not stream_url:
                    continue

                dur = int(item.get('more_info', {}).get('duration', 0) or 0)
                if dur > 0 and (dur < 50 or dur > 900):
                    continue

                artists = item.get('more_info', {}).get('artistMap', {}).get('primary_artists', [])
                artist_names = ', '.join([a.get('name') for a in artists if 'name' in a]) or item.get('subtitle', 'Unknown')
                img = item.get('image', '').replace('150x150.jpg', '500x500.jpg')
                title = item.get('title', '').replace('&quot;', '"').replace('&#039;', "'")

                results.append({
                    'id': 'saavn_' + str(item.get('id', '')),
                    'title': title,
                    'artist': artist_names,
                    'album': item.get('more_info', {}).get('album', 'Official Master'),
                    'cover': img or 'assets/default-cover.png',
                    'streamUrl': stream_url,
                    'duration': dur,
                    'isOnline': True,
                    'isOriginal': True,
                    'tag': 'online',
                    'source': 'saavn'
                })
            return results
    except Exception as e:
        print('[JioSaavn Search Notice]:', e)
        return []

def search_soundcloud(query, limit=5):
    try:
        # -j extracts full metadata including direct stream URL in single call (0ms delay at click time!)
        cmd = [
            'python3', '-m', 'yt_dlp',
            f'scsearch{limit}:{query}',
            '-j', '--no-warnings', '--quiet'
        ]
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        tracks = []
        for line in p.stdout.strip().split('\n'):
            if not line:
                continue
            try:
                d = json.loads(line)
                dur = int(d.get('duration') or 0)
                if dur > 0 and (dur < 50 or dur > 900):
                    continue
                art = 'assets/default-cover.png'
                thumbs = d.get('thumbnails') or []
                if thumbs:
                    art = thumbs[-1].get('url', art)
                
                track_id = 'sc_' + str(d.get('id'))
                direct_url = d.get('url')
                track_url = d.get('webpage_url') or d.get('url')
                
                if direct_url:
                    RESOLVED_STREAM_CACHE[track_id] = direct_url
                    RESOLVED_STREAM_CACHE[track_url] = direct_url

                tracks.append({
                    'id': track_id,
                    'title': d.get('title', 'Unknown Track'),
                    'artist': d.get('uploader') or 'SoundCloud Official',
                    'album': 'Studio Single',
                    'cover': art,
                    'streamUrl': f'/api/stream?id={track_id}&sc=' + urllib.parse.quote(track_url or ''),
                    'duration': dur,
                    'isOnline': True,
                    'isOriginal': True,
                    'tag': 'online',
                    'source': 'soundcloud'
                })
            except Exception:
                pass
        return tracks
    except Exception as e:
        print('[SoundCloud Search Notice]:', e)
        return []

def rewrite_m3u8(manifest_text):
    def repl_uri(m):
        full_url = m.group(1)
        return 'URI="/api/stream?url=' + urllib.parse.quote(full_url) + '"'
    text = re.sub(r'URI="(https?://[^"]+)"', repl_uri, manifest_text)

    lines = []
    for line in text.split('\n'):
        line_clean = line.strip()
        if line_clean.startswith('http://') or line_clean.startswith('https://'):
            lines.append('/api/stream?url=' + urllib.parse.quote(line_clean))
        else:
            lines.append(line)
    return '\n'.join(lines)

def resolve_sc_stream_url(track_id, sc_webpage_url):
    if track_id and track_id in RESOLVED_STREAM_CACHE:
        return RESOLVED_STREAM_CACHE[track_id]
    if sc_webpage_url and sc_webpage_url in RESOLVED_STREAM_CACHE:
        return RESOLVED_STREAM_CACHE[sc_webpage_url]
    
    if not sc_webpage_url:
        return None

    try:
        cmd = ['python3', '-m', 'yt_dlp', '-g', sc_webpage_url]
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        raw_url = p.stdout.strip().split('\n')[0]
        if raw_url and raw_url.startswith('http'):
            if track_id:
                RESOLVED_STREAM_CACHE[track_id] = raw_url
            RESOLVED_STREAM_CACHE[sc_webpage_url] = raw_url
            return raw_url
    except Exception as e:
        print('[SC Stream Resolve Error]:', e)
    return None

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        self.send_header('Accept-Ranges', 'bytes')
        if any(self.path.split('?')[0].endswith(ext) for ext in ['.html', '.js', '.css', '.json']) or self.path in ['/', '']:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_range_response(self, file_path, range_header):
        try:
            total_size = os.path.getsize(file_path)
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if not match:
                return super().do_GET()

            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else total_size - 1
            if start >= total_size or end >= total_size or start > end:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{total_size}')
                self.end_headers()
                return

            content_length = end - start + 1
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'audio/mp4' if file_path.endswith(('.m4a', '.mp4', '.m4s')) else 'audio/mpeg'

            self.send_response(206)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Range', f'bytes {start}-{end}/{total_size}')
            self.send_header('Content-Length', str(content_length))
            self.end_headers()

            with open(file_path, 'rb') as f:
                f.seek(start)
                bytes_left = content_length
                chunk_size = 64 * 1024
                while bytes_left > 0:
                    chunk = f.read(min(chunk_size, bytes_left))
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError):
                        break
                    bytes_left -= len(chunk)
        except Exception as e:
            print('[Range Stream Error]:', e)

    def proxy_remote_stream(self, remote_url):
        try:
            # 1. Check if the target is an m3u8 playlist: rewrite sub-URLs to proxy with CORS
            if '.m3u8' in remote_url or 'playlist' in remote_url:
                req = urllib.request.Request(remote_url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
                with urllib.request.urlopen(req, timeout=5) as r:
                    raw_text = r.read().decode('utf-8', errors='ignore')
                    rewritten = rewrite_m3u8(raw_text).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/vnd.apple.mpegurl')
                    self.send_header('Content-Length', str(len(rewritten)))
                    self.end_headers()
                    self.wfile.write(rewritten)
                    return

            # 2. Check local disk cache for this chunk / audio file
            url_hash = hashlib.md5(remote_url.encode('utf-8')).hexdigest()
            cached_file = os.path.join(CACHE_DIR, f'{url_hash}.audio')
            if os.path.isfile(cached_file) and os.path.getsize(cached_file) > 10000:
                range_header = self.headers.get('Range')
                if range_header:
                    self.send_range_response(cached_file, range_header)
                else:
                    self.send_static_file(cached_file)
                return

            # 3. Stream from remote CDN with Range forwarding
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
            range_header = self.headers.get('Range')
            if range_header:
                headers['Range'] = range_header

            req = urllib.request.Request(remote_url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as upstream:
                status = upstream.status
                self.send_response(status)
                for k, v in upstream.getheaders():
                    if k.lower() in ['content-type', 'content-length', 'content-range', 'accept-ranges']:
                        self.send_header(k, v)
                self.end_headers()

                # Stream response back to client in 64KB chunks and save to disk
                is_full = (status == 200) and (not range_header)
                cache_fd = open(cached_file, 'wb') if is_full else None
                chunk_size = 64 * 1024
                try:
                    while True:
                        chunk = upstream.read(chunk_size)
                        if not chunk:
                            break
                        try:
                            self.wfile.write(chunk)
                        except (BrokenPipeError, ConnectionResetError):
                            break
                        if cache_fd:
                            cache_fd.write(chunk)
                finally:
                    if cache_fd:
                        cache_fd.close()
        except Exception as e:
            print('[Proxy Stream Notice]:', e)
            if not self.wfile.closed:
                try:
                    self.send_response(502)
                    self.end_headers()
                except Exception:
                    pass

    def send_static_file(self, file_path):
        try:
            total_size = os.path.getsize(file_path)
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'audio/mp4' if file_path.endswith(('.m4a', '.mp4', '.m4s')) else 'audio/mpeg'
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(total_size))
            self.end_headers()
            with open(file_path, 'rb') as f:
                while True:
                    chunk = f.read(64 * 1024)
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError):
                        break
        except Exception as e:
            print('[Send Static Error]:', e)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # 1. API: Multi-source search (JioSaavn + SoundCloud)
        if parsed.path == '/api/search':
            qs = urllib.parse.parse_qs(parsed.query)
            q = qs.get('q', [''])[0].strip()
            results = []
            if q:
                # 1. JioSaavn official studio releases
                saavn_results = fetch_saavn_search(q)
                results.extend(saavn_results)

                # 2. SoundCloud tracks
                sc_results = search_soundcloud(q, limit=5)
                seen_titles = set((r['title'] + r['artist']).lower() for r in results)
                for r in sc_results:
                    k = (r['title'] + r['artist']).lower()
                    if k not in seen_titles:
                        results.append(r)
                        seen_titles.add(k)

            body = json.dumps(results, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 2. API: Audio Stream Proxy
        if parsed.path == '/api/stream':
            qs = urllib.parse.parse_qs(parsed.query)
            track_id = qs.get('id', [''])[0].strip()
            sc_url = qs.get('sc', [''])[0].strip()
            direct_url = qs.get('url', [''])[0].strip()

            target_stream_url = direct_url
            if not target_stream_url:
                target_stream_url = resolve_sc_stream_url(track_id, sc_url)

            if target_stream_url:
                self.proxy_remote_stream(target_stream_url)
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        # 3. Static file with Range Request (for iOS / Safari & lock-screen streaming)
        file_path = self.translate_path(self.path)
        if os.path.isfile(file_path):
            range_header = self.headers.get('Range')
            if range_header:
                self.send_range_response(file_path, range_header)
                return

        super().do_GET()

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadingHTTPServer(('0.0.0.0', PORT), CORSHTTPRequestHandler) as httpd:
        print(f"VIBE Ultra-Fast Music Server running at http://0.0.0.0:{PORT}")
        httpd.serve_forever()
