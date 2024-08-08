const CACHE_NAME = 'olympics-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/scripts/script.js',
    '/scripts/fetchCountries.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('olympics-static-v1').then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Se encontrar no cache, retorne-o
            if (cachedResponse) {
                return cachedResponse;
            }

            // Tente buscar na rede
            return fetch(event.request).catch(() => {
                // Se a rede falhar, retorne uma resposta padrão, como uma página offline
                return caches.match('/offline.html');
            });
        })
    );
});
