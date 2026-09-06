const CACHE_NAME = 'ironline-v1';
// NOTE: '/manifest.json' intentionally removed from pre-cache. Since the
// per-gym branded PWA feature (IMPLEMENTATION_PLAN.md Phase 5), the
// manifest link is swapped at runtime to /api/public/manifest/:slug for
// tenant visits — it's no longer a single static file, and pre-caching the
// static one here would risk serving a stale or wrong-tenant manifest.
// (The fetch handler below already excludes everything under /api/,
// including /api/public/manifest/ and /api/public/branding/, from caching.)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API requests, cache-first with network fallback for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls, webhooks, or upload endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests: try network, fall back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
