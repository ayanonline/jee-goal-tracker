const CACHE_NAME = "pretrack-v1";

const urlsToCache = [
    "/",
    "/index.html",
    "/css/style.css",
    "/js/script.js",
    "/favicon/android-icon-192x192.png",
    "/favicon/android-icon-512x512.png",
    "/favicon/manifest.json"
];

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME)
                        return caches.delete(key);
                })
            )
        )
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
