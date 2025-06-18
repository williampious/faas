// public/sw.js
const CACHE_NAME = 'agrifaas-connect-cache-v1';
const FILES_TO_CACHE = [
  '/',
  // Add other important static assets you want to pre-cache
  // For Next.js, dynamic JS/CSS chunks are harder to pre-cache here.
  // Runtime caching or more advanced service worker strategies are often used.
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline resources');
      // Filter out development/dynamic paths if any were accidentally included
      const cacheableFiles = FILES_TO_CACHE.filter(url => !url.startsWith('/_next/'));
      return cache.addAll(cacheableFiles).catch(error => {
        console.error('[ServiceWorker] Failed to cache all files:', error, cacheableFiles);
        // Optionally, decide if this should fail the install or proceed
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Strategy: Network first, then cache for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to serve the root page from cache as a fallback
          return caches.match('/');
        })
    );
    return;
  }

  // Strategy: Cache first, then network for other assets (CSS, JS, images)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optional: Cache new assets on the fly.
        // Be careful with what you cache here, especially API responses or dynamic content.
        if (fetchResponse.ok && event.request.method === 'GET') { // Only cache successful GET requests
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      }).catch(error => {
        console.warn(`[ServiceWorker] Fetch failed for ${event.request.url}; returning offline fallback if available or error.`, error);
        // Optionally, return a generic offline placeholder for images/assets if not in cache
      });
    })
  );
});
