const CACHE_NAME = 'roco-mbti-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cross-origin (e.g. patchwiki images): cache-first since they're immutable.
  if (!sameOrigin) {
    e.respondWith(
      caches.match(e.request).then(
        (res) =>
          res ||
          fetch(e.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Same-origin: network-first so HTML / JS updates take effect on normal refresh.
  // Cache is only a fallback when offline.
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
