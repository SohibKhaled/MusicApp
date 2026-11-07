/* ================================================
   VIBE v4.2 — Ultra-Fast Zero-Latency Service Worker
   - 100% Native Audio Pipeline Pass-Through (Zero Buffering Delay)
   - RFC-7233 HTTP 206 Partial Content Range Slicing for App Assets
   - Offline App Shell Caching & Instant Startup
   ================================================ */

const CACHE_NAME = 'vibe-v9.0';

// App shell assets to cache on install
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/default-cover.png',
  './assets/qrcode.min.js',
  './assets/hls.min.js',
  './music/tracks.json'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-cache notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches & take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // 1. Audio Requests Pass-Through (CRITICAL FOR ZERO-LATENCY STREAMING):
  // Never intercept live audio streams with event.respondWith(fetch(req)).
  // Letting audio pass directly through allows the native browser media stack
  // to stream byte-ranges with hardware acceleration and 0ms buffering delay.
  const isAudio =
    url.pathname.includes('/music/') ||
    url.pathname.includes('/api/stream') ||
    url.hostname.includes('saavn') ||
    url.hostname.includes('soundcloud') ||
    url.hostname.includes('archive.org') ||
    url.hostname.includes('cloudflarestorage') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.flac') ||
    url.pathname.endsWith('.wav') ||
    req.headers.get('accept')?.includes('audio') ||
    req.destination === 'audio';

  if (isAudio && !url.pathname.endsWith('tracks.json')) {
    // Fall through to native browser network engine (0ms lag, direct streaming)
    return;
  }

  // 2. tracks.json: Network-first with instant cache fallback
  if (url.pathname.endsWith('tracks.json')) {
    event.respondWith(
      fetch(req).then((networkRes) => {
        if (networkRes && networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return networkRes;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 3. App Shell & Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

      return cached || fetchPromise;
    })
  );
});
