// Durtup.shop Self-Healing Service Worker
// Automatically purges corrupted/stale chunk caches, unregisters legacy workers, and restores direct network speed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Purging all legacy caches:', keys);
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          if (client.url && client.navigate) {
            client.navigate(client.url);
          }
        });
      });
    })
  );
});

// Pass through all network requests directly - NEVER intercept or poison dynamic JS chunks
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
