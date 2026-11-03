/* ================================================
   VIBE v2.0 — Service Worker (Ultra-Fast & Offline)
   Caches app shell, music, and enables offline playback
   ================================================ */

const CACHE_NAME = 'vibe-v3.5';

// App shell assets to cache on install
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/default-cover.png',
  './assets/qrcode.min.js',
  './music/tracks.json'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
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

// Fetch: Smart network & caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // 1. tracks.json: Stale-While-Revalidate (Instant load from cache + background update)
  if (url.pathname.endsWith('tracks.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cachedResponse) => {
          const fetchPromise = fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Local Audio files (/music/): Cache-first for ultra-fast instant playback & low data
  if (url.pathname.includes('/music/') && !url.pathname.endsWith('tracks.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((response) => {
            // Only cache full 200 responses (skip 206 Partial Content for cache.put)
            if (response && response.status === 200) {
              cache.put(req, response.clone());
            }
            return response;
          }).catch(() => {
            return new Response('Audio unavailable offline', { status: 503, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // 3. Remote Audio Streams (Audius CDN) & Artwork: Cache when streamed
  if (url.hostname.includes('audius') || url.pathname.includes('/content/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((response) => {
            if (response && response.status === 200) {
              cache.put(req, response.clone());
            }
            return response;
          }).catch(() => cached || new Response('Offline audio', { status: 503 }));
        });
      })
    );
    return;
  }

  // 4. Default: Cache-first for App Shell, Network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
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
    })
  );
});
