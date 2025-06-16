// Basic Service Worker for AgriFAAS Connect

// Define a cache name
const CACHE_NAME = 'agrifaas-connect-cache-v1';

// List of files to cache on install (optional for a very basic setup)
// For a Next.js app, be careful with caching JS/CSS bundles directly as they are often fingerprinted.
// It's often better to let Next.js handle its specific assets and focus the SW on the app shell or specific static assets.
const urlsToCache = [
  '/', // Cache the root page
  // '/offline.html', // You would need to create an offline.html page
  '/agrifaas-logo.png', // Example: Cache your main logo if it's static
  // Add other static assets like custom fonts if not handled by Next.js optimization
];

// Install event: fires when the browser installs the service worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event fired');
  // Perform install steps, like pre-caching static assets
  // event.waitUntil(
  //   caches.open(CACHE_NAME)
  //     .then((cache) => {
  //       console.log('[ServiceWorker] Opened cache:', CACHE_NAME);
  //       return cache.addAll(urlsToCache.filter(url => !url.startsWith('https://placehold.co'))); // Example: Don't cache placeholders
  //     })
  //     .catch(err => {
  //       console.error('[ServiceWorker] Cache addAll failed during install:', err);
  //     })
  // );
  self.skipWaiting(); // Ensures the new service worker activates immediately
});

// Activate event: fires when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event fired');
  // Perform activate steps, such as cleaning up old caches
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.map((cacheName) => {
  //         if (cacheName !== CACHE_NAME) {
  //           console.log('[ServiceWorker] Deleting old cache:', cacheName);
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  event.waitUntil(self.clients.claim()); // Allows the activated service worker to take control of the page immediately
});

// Fetch event: fires for every network request made by the page
self.addEventListener('fetch', (event) => {
  // console.log('[ServiceWorker] Fetch event for:', event.request.url);
  // For a very basic service worker, we can just let the browser handle the fetch (network-first).
  // More advanced strategies (cache-first, stale-while-revalidate) can be implemented here.
  // Example: Network falling back to cache
  // event.respondWith(
  //   fetch(event.request).catch(() => {
  //     return caches.match(event.request).then((response) => {
  //       if (response) {
  //         return response;
  //       }
  //       // if (event.request.mode === 'navigate') {
  //       //   return caches.match('/offline.html'); // Return offline page for navigation requests
  //       // }
  //     });
  //   })
  // );
});
