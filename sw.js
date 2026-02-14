const CACHE_NAME = 'milo-radio-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/config.js',
  './js/services/radioService.js',
  './js/services/stationService.js', 
  './js/services/userStationService.js',
  './js/pages/page1.js',
  './js/pages/page2.js',
  './js/pages/page3.js',
  './images/cholo_love.png',
  './json/sender_daten.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
