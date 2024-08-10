const CACHE_NAME = 'olympics-cache-v1';
const urlsToCache = [
    './',
    './index.html',  
    './esportes.txt',
    './images/icon-192x192.png',
    './images/favicon.ico',
    './css/styles.css',
    './scripts/script.js',
    './scripts/fetchCountries.js',    
    './manifest.json',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log(`[Service Worker] activate event lifecycle!`);
    event.waitUntil(cacheCleanup());
    return self.clients.claim(); // claim all tabs
});

self.addEventListener('fetch', event => {
    event.respondWith((async () => {
        try {
            const response = await fetch(event.request);
            return response;
        } catch (error) {
            console.log('You are offline. Trying to fetch from cache...');
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            } else {
                console.log('No luck! You have no data to fetch from cache...');                                
                return Response.error();                
            }            
        }         
    })());
});

async function cacheCleanup() {
    const cacheKeys = await caches.keys();
    const outdatedCache = (cacheKey) => cacheKey !== CACHE_NAME;
    const purge = (cacheKey) => caches.delete(cacheKey);
    cacheKeys.filter(outdatedCache).forEach(purge);
    return true;
}  