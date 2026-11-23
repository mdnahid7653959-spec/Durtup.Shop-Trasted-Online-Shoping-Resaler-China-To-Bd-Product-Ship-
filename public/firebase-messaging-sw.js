// Durtup.shop Firebase Cloud Messaging (FCM) Background Service Worker
// Provides native push notification support for Android Chrome, Windows, Mac, and PWA

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCIcvphAtwx7rup-aV3MZPDK0w-xCN1Xoc",
  authDomain: "eshop-app-6119d.firebaseapp.com",
  projectId: "eshop-app-6119d",
  storageBucket: "eshop-app-6119d.firebasestorage.app",
  messagingSenderId: "18064875571",
  appId: "1:18064875571:web:0cd166f0bc0446c7bc0346"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background Push Notification Handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background FCM message:', payload);

    const title = payload.notification?.title || payload.data?.title || '🛍️ Durtup.shop আপডেট';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'নতুন অফার ও আপডেট দেখতে ক্লিক করুন।';
    const icon = payload.notification?.icon || payload.data?.icon || '/icon-192.png';
    const badge = payload.notification?.badge || payload.data?.badge || '/favicon-32x32.png';
    const image = payload.notification?.image || payload.data?.image || payload.data?.image_url || null;
    const targetUrl = payload.data?.url || payload.data?.action_url || payload.fcmOptions?.link || '/';

    const notificationOptions = {
      body,
      icon,
      badge,
      image,
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      tag: payload.data?.tag || `fcm-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: {
        url: targetUrl,
        timestamp: Date.now(),
        ...payload.data
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase initialization warning:', e);
}

// -------------------------------------------------------------
// Direct Web Push Fallback (Standard Web Push Protocol)
// -------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    // If not handled by FCM SDK directly:
    if (!data.fcmMessageId) {
      const title = data.title || data.notification?.title || '🛍️ Durtup.shop আপডেট';
      const body = data.body || data.notification?.body || data.message || '';
      const icon = data.icon || data.notification?.icon || '/icon-192.png';
      const badge = data.badge || '/favicon-32x32.png';
      const image = data.image || data.image_url || data.notification?.image || null;
      const targetUrl = data.url || data.action_url || data.data?.url || '/';

      const options = {
        body,
        icon,
        badge,
        image,
        vibrate: [400, 150, 400, 150, 400, 150, 800],
        tag: data.tag || `push-${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: {
          url: targetUrl,
          ...data.data
        }
      };

      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (err) {
    // Non-JSON payload fallback
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('🛍️ Durtup.shop', {
        body: text,
        icon: '/icon-192.png',
        badge: '/favicon-32x32.png',
        data: { url: '/' }
      })
    );
  }
});

// -------------------------------------------------------------
// Notification Click Handler (Open Target URL on Mobile & Desktop)
// -------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || event.notification.data?.action_url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Skip waiting & claim immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
