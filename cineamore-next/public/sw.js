// CineAmore Service Worker v2
// Optimized for blazing fast PWA performance

const CACHE_NAME = 'cineamore-v2';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in ms

// Pages to prefetch and cache aggressively
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

// Activate: Clean old caches
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

// Fetch: Stale-while-revalidate for pages, network-first for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and cross-origin
    if (event.request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // API calls: Always fetch fresh
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Priority pages: Stale-while-revalidate (instant + background refresh)
    if (PRIORITY_PAGES.includes(url.pathname)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);

                // Fetch fresh in background
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                // Return cached immediately, or wait for network
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Everything else: Network-first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
