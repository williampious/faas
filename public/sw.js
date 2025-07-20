
// A basic service worker for PWA caching and update notifications.
// This service worker uses a "network falling back to cache" strategy.

const CACHE_NAME = 'agrifaas-connect-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
  // Add other critical assets you want to cache on install, like the main logo.
  // Note: Most Next.js assets are uniquely named and handled by browser cache, 
  // so we keep this list minimal.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // This line is crucial for the new service worker to take over immediately.
  return self.clients.claim();
});
