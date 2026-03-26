/**
 * Service Worker WooPlans — Cache Strategique
 * Version: 1.0.0
 */

const CACHE_NAME = 'wooplans-v1';
const STATIC_CACHE = 'wooplans-static-v1';
const IMAGE_CACHE = 'wooplans-images-v1';

// Assets à précharger
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/merci.html'
];

// Stratégies de cache
const STRATEGIES = {
  // Network First pour les données Supabase
  api: async (request) => {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw error;
    }
  },

  // Cache First pour les images
  image: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(IMAGE_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  },

  // Stale While Revalidate pour le HTML statique
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }).catch(() => cached);

    return cached || fetchPromise;
  }
};

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !name.startsWith('wooplans-'))
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non GET
  if (request.method !== 'GET') return;

  // API Supabase
  if (url.hostname.includes('supabase')) {
    event.respondWith(STRATEGIES.api(request));
    return;
  }

  // Images
  if (request.destination === 'image') {
    event.respondWith(STRATEGIES.image(request));
    return;
  }

  // HTML statique
  if (request.mode === 'navigate') {
    event.respondWith(STRATEGIES.staleWhileRevalidate(request));
    return;
  }
});

// Background Sync pour offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'checkout-sync') {
    event.waitUntil(syncPendingCheckouts());
  }
});

async function syncPendingCheckouts() {
  // Logique de sync si nécessaire
  console.log('[SW] Syncing pending checkouts...');
}

// Push notifications (préparation)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: data.url
      })
    );
  }
});
