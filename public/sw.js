const CACHE_NAME = 'durtup-v20';
const STATIC_CACHE = 'durtup-static-v20';
const DYNAMIC_CACHE = 'durtup-dynamic-v20';

// Assets to cache immediately on SW install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/durtup-logo-transparent.png',
  '/icon-192.png',
  '/icon-512.png',
  '/banners/hero-banner-1.webp',
  '/banners/hero-banner-2.webp',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v18...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v17...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;

  // Skip Vite dev module files (prevents blank screens in local development)
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  // Skip API requests from caching
  if (url.pathname.startsWith('/rest/') || url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Stale-While-Revalidate for catalog slim (instant load on revisit)
  if (url.pathname === '/mohasagor_catalog_slim.json') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Production hashed assets (/assets/...) - Cache First (immutable)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For navigation requests, use network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // Static images & fonts - Cache First with background refresh
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request).then((response) => {
            if (response.status === 200 || response.type === 'opaque') {
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.status === 200 || response.type === 'opaque') {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clonedResponse = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle rich push notifications (with product images & sound/vibrate)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '🛍️ New Order Received - Durtup.shop';
    const prodImg = data.image || data.product_image;

    event.waitUntil(
      self.registration.showNotification(title, {
        body: data.body || 'A new order has been placed on Durtup.shop!',
        icon: prodImg || '/durtup-logo.png',
        badge: '/durtup-logo.png',
        image: prodImg || undefined,
        vibrate: [400, 150, 400, 150, 400, 150, 800],
        requireInteraction: true,
        tag: data.tag || `durtup-${Date.now()}`,
        data: {
          url: data.url || '/admin/orders',
          order_id: data.order_id
        },
        actions: [
          { action: 'view_order', title: '🛍️ View Order' },
          { action: 'open_admin', title: '⚡ Open Admin' }
        ]
      })
    );
  } catch (err) {
    console.warn('[SW] Push notification parse error:', err);
  }
});

// Handle custom messages from web app (Customer & Admin push notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload || {};
    const prodImg = payload.image || payload.product_image || '/durtup-logo.png';
    const targetUrl = (payload.data && payload.data.url) || '/';

    self.registration.showNotification(payload.title || '🛍️ Durtup.shop - অর্ডার সফল হয়েছে!', {
      body: payload.body || 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।',
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      image: prodImg,
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      requireInteraction: true,
      tag: payload.tag || `durtup-msg-${Date.now()}`,
      data: payload.data || { url: targetUrl }
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
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

