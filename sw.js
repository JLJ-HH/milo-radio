/**
 * SERVICE WORKER (sw.js)
 *
 * Ermöglicht die Offline-Nutzeung der App, indem wichtige Dateien
 * im Browser-Cache gespeichert werden.
 */

const CACHE_NAME = "milo-radio-v1";

// Liste der Dateien, die für den Offline-Betrieb gespeichert werden sollen
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/config.js",
  "./js/services/radioService.js",
  "./js/services/stationService.js",
  "./js/services/userStationService.js",
  "./js/pages/page1.js",
  "./js/pages/page2.js",
  "./js/pages/page3.js",
  "./images/android.png",
  "./images/cholo_love.png",
  "./images/qr-code.png",
  "./json/sender_daten.json",
];

/**
 * INSTALL-EVENT: Wird beim ersten Laden oder bei Updates ausgeführt.
 * Hier werden alle definierten Dateien in den Cache geladen.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

/**
 * FETCH-EVENT: Wird bei jeder Netzwerkanfrage der App aufgerufen.
 * Prüft zuerst, ob die Datei im Cache liegt. Wenn ja, wird sie von dort geladen.
 */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
