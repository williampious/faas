// public/sw.js

// Using a versioned cache name helps in managing updates.
// When you update the service worker file, update this version number.
const CACHE_VERSION = 2; 
const CACHE_NAME = `agrifaas-connect-cache-v${CACHE_VERSION}`;

// These are the core assets that make up the app shell.
const APP_SHELL_URLS = [
  '/',
  '/manifest.json',
  '/agrifaas-logo.png',
  '/apple-touch-icon.png',
  // Note: Add other critical assets like fonts or icons if needed.
  // Avoid caching everything to keep the install size small.
];

// On install, cache the app shell.
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// On activation, clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache's name is not in our whitelist (i.e., it's an old version), delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients (open tabs) immediately.
      // This is crucial for the 'controllerchange' event to fire in the client.
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// On fetch, serve from cache first, then fall back to network.
// This strategy is good for the app shell and static assets.
self.addEventListener('fetch', (event) => {
    // For navigation requests (loading a page), use a network-first strategy
    // to ensure users get the latest HTML, but fall back to cache if offline.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // For other requests (CSS, JS, images), use a cache-first strategy.
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // If we get a valid response, cache it for next time.
                return caches.open(CACHE_NAME).then((cache) => {
                    if (fetchResponse && fetchResponse.status === 200) {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        })
    );
});
