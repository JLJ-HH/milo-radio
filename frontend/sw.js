/**
 * SERVICE WORKER (sw.js)
 *
 * Ermöglicht die Offline-Nutzeung der App, indem wichtige Dateien
 * im Browser-Cache gespeichert werden.
 */

const CACHE_NAME = "milo-radio-v7";

// Liste der Dateien, die für den Offline-Betrieb gespeichert werden sollen
// Pfade sind nun relativ zum Frontend-Root
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
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

/**
 * INSTALL-EVENT: Wird beim ersten Laden oder bei Updates ausgeführt.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting(); 
});

/**
 * ACTIVATE-EVENT: Wird nach der Installation ausgeführt.
 */
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

/**
 * FETCH-EVENT: Wird bei jeder Netzwerkanfrage der App aufgerufen.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass Cache für Backend-API-Anfragen (../backend/api/)
  // Wenn der Request "api" im Namen hat, gehen wir direkt ins Web
  if (url.pathname.includes("/api/")) {
    return; 
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
