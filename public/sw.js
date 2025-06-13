
const CACHE_NAME = 'agrifaas-connect-cache-v1';
const urlsToCache = [
  '/',
  // Add other important static routes or assets you want to pre-cache
  // For Next.js, the build output will have hashed names, so this basic list might need adjustment
  // or a more sophisticated build-time generation of this list.
  // For now, we cache the root. Dynamic routes and API calls are not cached by this basic SW.
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting(); // Activate the SW immediately
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all open pages
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, try network first, then cache (Network-First strategy for HTML).
  // This ensures users get the latest HTML if online, but still have a fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful, clone the response and store it in the cache.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache.
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/'); // Fallback to root if specific page not cached
          });
        })
    );
    return;
  }

  // For other static assets (CSS, JS, images), use a Cache-First strategy.
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          (response) => {
            // If response is valid, clone it and cache it.
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});
