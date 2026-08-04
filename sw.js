// Offline is the whole point: this runs on a mountain in Argentina with no bars.
// Cache-first on everything, so once installed the app never waits on a network
// that is not there. Bump CACHE to ship an update.
const CACHE = 'track-log-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) {
        // Refresh in the background when there IS a signal, but never block on it.
        event.waitUntil(
          fetch(event.request)
            .then((res) => (res.ok ? caches.open(CACHE).then((c) => c.put(event.request, res.clone())) : null))
            .catch(() => {}),
        );
        return hit;
      }
      return fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    }),
  );
});
