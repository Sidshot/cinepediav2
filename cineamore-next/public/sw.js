// CineAmore Service Worker v4
// Security fix: never serve cached HTML ahead of the site gate.

const CACHE_NAME = 'cineamore-v4';
const CACHE_PREFIX = 'cineamore-';
const STATIC_ASSETS = [
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET' || url.origin !== location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    const isNavigation = event.request.mode === 'navigate';
    const isRSC = event.request.headers.get('RSC') === '1';

    if (isNavigation && !isRSC) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                const isSafeStatic =
                    networkResponse.ok &&
                    !url.pathname.startsWith('/_next/data/') &&
                    !event.request.headers.get('RSC');

                if (isSafeStatic) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }

                return networkResponse;
            });
        })
    );
});
