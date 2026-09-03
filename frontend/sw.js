/**
 * SERVICE WORKER (sw.js)
 *
 * Ermöglicht die Offline-Nutzung der App mit intelligenter Network-First-Strategie
 * für sofortige Aktualisierungen auf Mobilgeräten.
 */

const CACHE_NAME = "milo-radio-v21";

const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/components/playerBar.js",
  "./js/services/radioServiceV2.js",
  "./js/services/stationServiceV5.js",
  "./js/services/userStationService.js",
  "./js/pages/radioPage.js",
  "./js/pages/settingsPage.js",
  "./js/pages/genresPage.js",
  "./js/pages/statsPage.js",
  "./images/android.png",
  "./images/cholo_love.png",
  "./images/milo.jpg",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Alter Cache gelöscht:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. API Anfragen immer direkt ans Netzwerk
  if (url.pathname.includes("/api/")) {
    return;
  }

  // 2. Network-First für Navigation, HTML und JS-Dateien:
  // Immer zuerst die neueste Version vom Server laden!
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.search.includes("v=")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // 3. Cache-First für statische Assets (Bilder, Icons, CSS)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
      );
    }),
  );
});
