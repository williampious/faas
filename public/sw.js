
// A basic service worker to enable PWA capabilities.
// This file is intentionally simple for now.

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  // event.waitUntil(
  //   caches.open('v1').then((cache) => {
  //     return cache.addAll([
  //       // assets to cache
  //     ]);
  //   })
  // );
});

self.addEventListener('fetch', (event) => {
  // console.log('[ServiceWorker] Fetch', event.request.url);
  // event.respondWith(
  //   caches.match(event.request).then((response) => {
  //     return response || fetch(event.request);
  //   })
  // );
});
