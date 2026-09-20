const CACHE_NAME = 'borsa-takip-v9';
const ASSETS = [
  'index.html',
  'css/app.css',
  'js/mynet-slugs.js',
  'js/store.js',
  'js/app.js',
  'manifest.json'
];

// Install Event: Cache essential assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache first, fallback to network
self.addEventListener('fetch', (e) => {
  // Sadece kendi origin'imizdeki GET isteklerini cache'le.
  // Haber kaynagi (Mynet) gibi cross-origin istekler cache-first mantiginda
  // kalici olarak saklanip bayat veri dondururdu; onlari aga birakiyoruz.
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch from network in the background to keep cache fresh
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => { /* ignore fetch errors when offline */ });
        
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
