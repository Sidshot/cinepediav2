// CineAmore Service Worker v3
// Fixed: Only serve cached HTML for navigation requests (fixes RSC/JSON bug)

const CACHE_NAME = 'cineamore-v3';

// Pages to prefetch and cache for offline access
const PRIORITY_PAGES = ['/', '/series', '/anime'];
const STATIC_ASSETS = [
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install: Cache static assets + priority pages
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([...STATIC_ASSETS, ...PRIORITY_PAGES]);
        })
    );
    self.skipWaiting();
});

// Activate: Clean old caches immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('cineamore-') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Only handle GET requests from our origin
    if (event.request.method !== 'GET' || url.origin !== location.origin) return;

    // 2. API calls: Network Only
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 3. Navigation Requests (HTML): Stale-while-revalidate
    // CRITICAL FIX: Only serve cached HTML if it's a navigation request.
    // This prevents serving HTML for Next.js RSC/JSON requests.
    const isNavigation = event.request.mode === 'navigate';
    const isRSC = event.request.headers.get('RSC') === '1';

    if (isNavigation && !isRSC) { // strict navigation check
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);

                // Fetch fresh in background to update cache
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                // Return cached response immediately if available, else wait for network
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 4. Static Assets (Images, JS, CSS): Cache First
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
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
