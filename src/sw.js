// ============================================
// Service Worker - WooPlans Shop v3
// Cache-first strategy pour performances optimales
// ============================================

const CACHE_NAME = 'wooplans-v3';
const STATIC_CACHE = 'wooplans-static-v3';
const IMAGE_CACHE = 'wooplans-images-v3';

// Assets à pré-cacher
const PRECACHE_ASSETS = [
  '/',
  '/fr/',
  '/css/main.css',
  '/js/main.js',
  '/js/countdown.js',
  '/js/gallery.js',
  '/js/checkout.js',
  '/js/faq.js'
];

// Installation - Précache des assets essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wooplans-') && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ne pas intercepter les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ne pas intercepter les requêtes API
  if (url.pathname.startsWith('/api/')) return;
  
  // Images - Cache avec expiration
  if (request.destination === 'image' || url.hostname === 'wooplans.b-cdn.net') {
    event.respondWith(cacheImage(request));
    return;
  }
  
  // CSS/JS/Fonts - Cache First
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Pages HTML - Stale While Revalidate
  if (request.destination === 'document' || request.headers.get('Accept').includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Default - Network First
  event.respondWith(networkFirst(request));
});

// Cache First - pour assets statiques
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

// Stale While Revalidate - pour pages HTML
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Network First - fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Cache spécial pour images avec limite de taille
async function cacheImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  const response = await fetch(request);
  
  // Limiter le cache images à 50MB (environ)
  const cacheSize = await getCacheSize(IMAGE_CACHE);
  if (cacheSize < 50 * 1024 * 1024) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Obtenir la taille du cache
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let size = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }
  
  return size;
}

// Messages depuis le client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
