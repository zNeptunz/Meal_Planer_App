const CACHE = 'familienplan-v3';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first for index.html so updates are always picked up
// Fall back to cache only if offline
self.addEventListener('fetch', e => {
  if (e.request.url.includes('index.html') || e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).catch(() => caches.match('./index.html')))
    );
  }
});

// Notify clients when a new SW is waiting
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
