// Durtup.shop Official Service Worker & Push Notification Handler
// High performance, zero chunk poisoning, real-time push notification support for Android & Desktop

const SW_VERSION = 'v2.1.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass through all network requests directly to ensure real-time API & dynamic chunk speed
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// -------------------------------------------------------------
// Web Push Event Handler (OS / Android Phone / Desktop Notification Tray)
// -------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Durtup.shop',
        body: event.data.text()
      };
    }
  }

  const title = data.title || data.notification?.title || '🛍️ Durtup.shop আপডেট';
  const body = data.body || data.notification?.body || data.message || 'নতুন অফার ও আপডেট দেখতে ক্লিক করুন।';
  const icon = data.icon || data.notification?.icon || '/icon-192.png';
  const badge = data.badge || '/favicon-32x32.png';
  const image = data.image || data.image_url || data.notification?.image || null;
  const targetUrl = data.url || data.action_url || data.data?.url || '/';

  const notificationOptions = {
    body,
    icon,
    badge,
    image,
    vibrate: [400, 150, 400, 150, 400, 150, 800],
    tag: data.tag || `durtup-push-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: targetUrl,
      timestamp: Date.now(),
      ...data.data
    }
  };

  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

// -------------------------------------------------------------
// Notification Click Handler (Deep Link & Smart Window Focusing)
// -------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || event.notification.data?.action_url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing tab is open on this origin, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            try {
              client.navigate(targetUrl);
            } catch (err) {}
          }
          return client.focus();
        }
      }

      // 2. Otherwise open a new window with the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// -------------------------------------------------------------
// Inter-Process Message Dispatcher (Foreground Window -> SW)
// -------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const p = event.data.payload || {};
    const title = p.title || '🛍️ Durtup.shop';
    const options = {
      body: p.body || '',
      icon: p.icon || '/icon-192.png',
      badge: p.badge || '/favicon-32x32.png',
      image: p.image || p.product_image || null,
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      tag: p.tag || `durtup-local-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: {
        url: p.data?.url || p.url || '/',
        ...p.data
      }
    };
    self.registration.showNotification(title, options);
  }
});
