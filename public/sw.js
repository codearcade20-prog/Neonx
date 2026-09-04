// Minimal Service Worker for PWA installability
const CACHE_NAME = 'neonx-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle online requests normally
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
