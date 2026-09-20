# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.7.0] - 2026-09-20

### Hinzugefügt (Online-Radiosendersuche & 1-Klick Auto-Fill via Radio-Browser)
- **Backend Radio-Search API mit Caching (`backend/api/radio_search.php`):**
  - Durchsucht das weltweite Radio-Browser-Verzeichnis (> 40.000 Sender) in Echtzeit.
  - Liefert Sendername, Audio-Stream-URL (`url_resolved`), offizielles Sender-Logo (`favicon`), Genre und Codec/Bitrate.
  - 10-Minuten Server-Cache (`sys_get_temp_dir()`) für minimale Ladezeiten und Schutz der Schnittstelle.
- **Elegantes Tab-System ohne Emojis im Admin-Panel (`adminPage.js`):**
  - Modernes, aufgeräumtes Design mit schlichten Bootstrap-Icons (`bi-broadcast`, `bi-rss`, `bi-search`) und sauberer Typografie – ohne Emojis.
  - Tab 1: **Radiosender suchen** – Sendernamen eingeben (z. B. „Rock Antenne“, „Sunshine Live“, „1LIVE“), Trefferliste mit Senderlogo, Genre und Bitrate durchstöbern und per Klick auf „Übernehmen“ alle Formularfelder automatisch befüllen lassen.
  - Tab 2: **Podcast importieren** – Bequemes Importieren von RSS-/Podigee-Links wie gewohnt.
- **PWA Service Worker & Cache-Busting auf v37 (`sw.js`, `index.html`, `main.js`):**
  - `CACHE_NAME` auf `milo-radio-v37` angehoben und Versions-Parameter in `index.html` und `main.js` synchronisiert.

## [1.6.0] - 2026-09-20

### Behoben
- **Template-Literal Syntaxfehler in `adminPage.js`:**
  - Schließendes Backtick (` ` `) und End-Tag im Template-String der `showAlert`-Funktion wiederhergestellt, wodurch alle nachfolgenden Syntax-Warnungen im Editor vollständig behoben wurden.

### Hinzugefügt (Vollständige Podcast-Integration & intelligentes Audio-Handling)
- **Backend Podcast RSS-Feed Resolver mit Caching (`backend/api/podcast.php`):**
  - Automatisches Auslesen von Podcast-Feeds (XML/RSS) mit Namespace-Unterstützung (`itunes:image`, `itunes:duration`, `enclosure`, etc.).
  - `action=info`: Liefert Channel-Metadaten für den Admin Auto-Fill (Titel, Beschreibung, Logo, Genre, neueste Folge).
  - `action=episodes`: Liefert die letzten N Episoden inklusive Audio-Stream-URL, Publikationsdatum und formatierter Laufzeit.
  - 15-Minuten Server-Cache (`sys_get_temp_dir()`) zur Entlastung externer Podcast-Server und für minimale Ladezeiten.
- **Frontend Podcast Service (`frontend/js/services/podcastService.js`):**
  - Automatische Erkennung von Podcasts anhand des Genres (`Podcast`) oder Feed-URL-Strukturen (`/feed`, `.xml`, `podigee.io`).
  - Asynchrone Auflösung der tatsächlichen Audio-URL der neuesten Folge beim Klick auf Play.
- **Player-Upgrade: Echtes Play/Pause, Timeline & 15s Skip (`radioServiceV2.js`, `playerBar.js`, `index.html`):**
  - Implementierung von `pause()` und `resume()`: Beim Pausieren von Podcasts bleibt die aktuelle Spielzeit (`currentTime`) exakt erhalten (kein Zurücksetzen auf 0:00 mehr).
  - Fortschrittsleiste (Scrubber) mit Zeitanzeige (`Aktuelle Zeit / Gesamtlänge`) zum sekundengenauen Vor- und Zurückspulen.
  - Skip-Buttons (`-15s` / `+15s`) für schnelles Springen in Podcast-Folgen.
  - Automatischer UI-Wechsel: Normales Radio behält die schlanke Live-Stream-Leiste, Podcasts schalten automatisch die Timeline und den Play/Pause-Button frei.
- **Episodenauswahl in der Genre-Übersicht (`genresPage.js`):**
  - Auf jeder Podcast-Karte befindet sich neben dem Sofort-Play-Button für die neueste Folge ein Button **„Weitere Folgen“**.
  - Klappt eine übersichtliche Liste der letzten Episoden mit Datum, Laufzeit und individuellem Play-Button auf.
- **Admin 1-Klick Podcast Auto-Import (`adminPage.js`):**
  - Neuer Bereich im Admin-Formular: Eingabe einer Feed-URL (z. B. `https://kiupdate.podigee.io/feed/mp3`) liest per Zauberstab alle Metadaten (Name, Genre, Logo, Stream-URL) vollautomatisch aus.
- **PWA Service Worker & Cache-Busting auf v36 (`sw.js`, `index.html`, `main.js`):**
  - `CACHE_NAME` auf `milo-radio-v36` angehoben und `podcastService.js` in die Offline-Cache-Liste aufgenommen.

## [1.5.12] - 2026-09-20

### Behoben (Strato Shared-Hosting Cookie-Authentifizierung & Play/Stop-Karten-Toggle)
- **Kryptographische Admin-Token-Cookies (`auth.php`, `manage_station.php`, `get_admin_stats.php`):**
  - Strato Shared Hosting betreibt PHP-Worker über FastCGI-Cluster, wodurch Standard-PHP-Dateisessions (`PHPSESSID`) zwischen aufeinanderfolgenden API-Requests oft verloren gingen (HTTP 403 bei Speichern im Admin-Panel).
  - Einführung eines sicheren, signierten HTTP-Only Cookies (`milo_admin_token`) via HMAC-SHA256, der auch bei Cluster-Sessions 100% zuverlässig persistiert.
  - Einbindung von `credentials: "include"` in `stationServiceV5.js`.
- **Play/Stop-Toggle auf Senderkarten (`radioPage.js`):**
  - Beim Klick auf den Button eines bereits aktiven Senders (`Läuft`) wird die Wiedergabe nun sofort gestoppt/pausiert, anstatt den Stream fehlerhaft neu anzuspielen.
- **Audio-Lebenszyklus & Ended-Handling (`radioServiceV2.js`):**
  - Event-Listener für `ended` und `error` auf dem HTML5-Audio-Element implementiert, damit finite Audio-Dateien (z. B. Podcasts oder Sendeschluss) den Player sauber in den Ruhezustand versetzen.
- **PWA Service Worker Cache v35 (`sw.js`, `index.html`, `main.js`):**
  - Cache-Version auf `milo-radio-v35` angehoben.

## [1.5.11] - 2026-09-20

### Hinzugefügt & Behoben (Persistente Sender-Verwaltung in Strato MySQL-Datenbank)
- **Neuer CRUD-API-Endpunkt (`backend/api/manage_station.php`):**
  - Vollständige Anbindung an die MySQL-Tabelle `stations` für Erstellen (`add`), Aktualisieren (`update`) und Löschen (`delete`) von Sendern.
  - Abgesichert durch Prüfung der Admin-Session (`$_SESSION['isAdmin'] === true`) mit HTTP 403 Schutz.
  - Automatischer Sync mit der Fallback-Datei `frontend/json/sender_daten.json`.
- **API-First Caching-Strategie (`stationServiceV5.js`):**
  - Primäres Laden der Sender aus der Datenbank via `get_stations.php` mit Speicherung im `localStorage` als reiner Offline-Cache (verhindert das Überschreiben serverseitiger Sender durch veraltete lokale Daten).
  - Umstellung von `add()`, `update()` und `remove()` auf asynchrone Server-Requests an `manage_station.php`.
- **Interaktives Admin-Panel & UX (`adminPage.js`):**
  - Umstellung des Formulars und der Senderkarten auf eindeutige Datenbank-IDs (`station.id`) statt fehleranfälliger Array-Indizes.
  - Ladezustands-Animation (`Spinner`) auf dem Speichern-Button während laufender API-Requests.
  - Visuelle Erfolgs- und Fehlermeldungen direkt im Formular (`#stationAlert`) ohne störende Popup-Dialoge.
- **Cache-Bumping auf v34 (`sw.js`, `index.html`, `main.js`, `settingsPage.js`):**
  - Cache-Name auf `milo-radio-v34` angehoben und alle Skript- sowie Stylesheet-Referenzen synchronisiert, damit Änderungen auf Smartphones und PWAs sofort wirksam werden.

## [1.5.10] - 2026-09-11

### Behoben (Navbar Mobile-Menü als schwebendes Overlay & CSS-Reparatur)
- **Floating Overlay für Mobile-Navigation (`style.css`, `main.js`):**
  - Umstellung des mobilen Ausklappmenüs (`.navbar-collapse` und `.navbar-collapse.collapsing`) auf absolute Positionierung (`position: absolute; top: 100%; left: 0; right: 0; width: 100%`).
  - Beim Öffnen des Hamburger-Menüs ganz oben auf der Seite wird der Seiteninhalt (`#app-content`) nicht mehr abrupt um ~250px nach unten gedrückt, sondern elegant schwebend verdeckt.
  - Integration von Glassmorphism-Backdrop (`backdrop-filter: blur(20px)`), dezentem Rahmen, sanften Rundungen und Scroll-Sicherheit (`max-height: calc(100dvh - 85px); overflow-y: auto`).
  - Automatisches Schließen des Menüs bei Klick außerhalb der Navigationsleiste (`main.js`).
- **CSS-Syntaxkorrektur & Bereinigung (`style.css`):**
  - Behebung einer unvollständig geschlossenen Media-Query (`@media (max-width: 768px)`), die zuvor nachfolgende Root-Regeln der Sticky-Player-Bar versehentlich umschlossen hatte.
  - Entfernung redundanter, veralteter `.navbar-nav`-Stile.
- **Cache-Bumping auf v33 (`sw.js`, `index.html`, `main.js`):**
  - Cache-Name auf `milo-radio-v33` angehoben und alle Skript- sowie Stylesheet-Referenzen synchronisiert.

## [1.5.9] - 2026-09-11

### Behoben (Sticky-Player-Bar Flexbox-Zusammenführung & CSS Network-First)
- **Vereinter Controls- & Lautstärke-Wrapper (`index.html`, `style.css`):**
  - Vollständige Zusammenführung der Play/Stop-Buttons und des Lautstärkereglers auf Mobilgeräten in einen gemeinsamen Flexbox-Container (`.player-controls-wrapper` mit `justify-content: space-between`).
  - Auflösung der separaten Bootstrap-Spalten auf mobilen Geräten: Horizontale Überlappungen von Buttons und Schieberegler sind dadurch im DOM physikalisch und rechnerisch unmöglich.
  - Dedizierte Begrenzungen (`.player-volume-container`, `.player-volume-slider`) mit flexibler Schrumpffähigkeit (`min-width: 35px`, `flex: 1 1 auto`).
- **PWA Service Worker Network-First für CSS (`sw.js`):**
  - Einbindung von `.css`-Dateien in die prioritäre Network-First-Abrufstrategie von `sw.js`, um aggressive Cache-Verzögerungen auf Mobilgeräten und installierten PWAs dauerhaft zu verhindern.
- **Cache-Bumping auf v32 (`sw.js`, `index.html`, `main.js`):**
  - Cache-Name auf `milo-radio-v32` angehoben und alle Skript- sowie Stylesheet-Referenzen synchronisiert.

## [1.5.8] - 2026-09-11

### Behoben (Mobile Sticky-Player-Bar Layout-Kollision)
- **Flexibles Grid & Responsive Buttons (`index.html`, `style.css`):**
  - Behebung des Problems, dass auf Smartphones der Lautstärkebereich (Lautsprecher-Icon und Schieberegler) in den Stop-Button hineinragte bzw. diesen überlappte.
  - Ersatz der starren `col-6` / `col-6`-Aufteilung durch `col-auto flex-shrink-0` für die Play/Stop-Controls und `col` mit bündiger Rechtsausrichtung für den Lautstärkeregler.
  - Kompakte, touchfreundliche Paddings für `.player-ctrl-btn` sowie dynamische Breitenbegrenzung (`player-volume-slider`) für kleine Bildschirme (bis hinunter zu 320px).
- **Interaktiver Mute-Toggle (`playerBar.js`, `style.css`):**
  - Klickbares Lautsprecher-Icon (`#volumeIcon`) zum schnellen Stummschalten und Wiederherstellen der vorherigen Lautstärke.
  - Dynamischer Statuswechsel des Icons (`bi-volume-mute-fill`, `bi-volume-down-fill`, `bi-volume-up-fill`) passend zum Lautstärkepegel.
- **Service Worker & Cache v31 (`sw.js`, `index.html`, `main.js`):**
  - Cache-Version auf `milo-radio-v31` angehoben und Versions-Parameter in `index.html` und `main.js` auf `v=31` synchronisiert.

## [1.5.7] - 2026-09-05

### Behoben (Mobile Ansicht Top 5 Sender Play-Buttons)
- **Flexbox & Text-Truncation Fix (`statsPage.js`):**
  - Behebung des Problems, dass auf schmalen Smartphone-Bildschirmen (< 400px) lange Sendernamen die Play-Buttons der Top 5 Sender aus dem sichtbaren Bereich nach rechts geschoben haben.
  - Dedizierte CSS-Klassen (`.top-station-row`, `.top-station-info`, `.top-station-meta`, `.btn-top-play`) mit `min-width: 0`, `overflow: hidden` und `flex-shrink: 0` implementiert.
  - Textkürzung (`text-truncate` mit Auslassungspunkten `...`) für lange Sendernamen greift nun auf Mobilgeräten zuverlässig.
  - Auch die Karte *„Zuletzt gehört“* (`lastActiveContent`) gegen Überlaufen bei langen Sendernamen abgesichert.
- **Service Worker & Cache v30:**
  - Cache-Version in `sw.js` auf `milo-radio-v30` angehoben und Versions-Parameter in `index.html` und `main.js` auf `v=30` synchronisiert.

## [1.5.6] - 2026-09-05

### Verbessert (Farbdesign Entfernen-Button)
- **Neues Slate-Farbschema für den Entfernen-Button (`style.css`, `radioPage.js`):**
  - **Standard-Zustand:** Dezentes Slate-Design mit transparentem Hintergrund (`background-color: transparent`), feinem Rahmen (`1px solid #334155`) und dezentem Hellgrau (`#94a3b8`) für den Text.
  - **Hover-Zustand:** Subtile Hervorhebung (`background-color: rgba(51, 65, 85, 0.4)`, Textfarbe `#e2e8f0`).
  - **Bestätigungs-Zustand („Sicher entfernen?“):** Solider Schiefergrau-Ton (`background-color: #475569`), heller Rahmen (`1px solid #64748b`) und weißer Text (`#ffffff`).
- **Service Worker & Cache v29:**
  - Cache-Version auf `milo-radio-v29` angehoben und Versions-Parameter in `index.html` und `main.js` auf `v=29` synchronisiert.

## [1.5.5] - 2026-09-05

### Verbessert (UI-Bereinigung Favoriten-Karten)
- **Entfernen-Button auf der Radio-Seite (`radioPage.js`):**
  - Mülleimer-Icon (`bi-trash3`) vom Button entfernt für eine minimalistischere Optik.
  - Bestätigungstext von `"Sicher löschen?"` zu `"Sicher entfernen?"` umformuliert.
- **Service Worker & PWA Cache v28:**
  - Cache-Version auf `milo-radio-v28` angehoben und alle Skript-Versionen (`index.html`, `main.js`) synchronisiert.

## [1.5.4] - 2026-09-05

### Behoben / Verbessert (Playlist-Entfernung & Analytics-Wiederherstellung)
- **Zuverlässiges Entfernen von Sendern aus der Top-6-Playlist (`radioPage.js`, `userStationService.js`):**
  - Blockierendes und fehleranfälliges `window.confirm()` durch einen modernen, berührungsfreundlichen 2-Klick-Bestätigungs-Button (`Entfernen` -> `Sicher löschen?`) mit Mülleimer-Icon und automatischem Timeout ersetzt.
  - Neue zentrale Methode `removeStation(target)` in `userStationService.js` implementiert, die Sender zuverlässig nach Index, Objekt oder URL aus `localStorage` entfernt und Event-Subscriber reaktiv benachrichtigt.
- **Wiederherstellung des Analytics-Dashboards (`get_stats.php`, `db.php`, `statsPage.js`):**
  - Behebung des SQL-Fehlers bei `GROUP BY` auf `TEXT`-Spalten (`sender_url`, `sender_logo`, `now_playing_url`) in `get_stats.php` durch Aggregation mit `MAX()`.
  - Bereitstellung sauberer Null-Datenstrukturen (HTTP 200) bei neuen oder leeren Nutzer-Sessions anstelle von fatalen Abbrüchen.
  - Automatische Umgebungserkennung in `db.php`: Nutzt `.env.local` bei lokaler Ausführung (`localhost` / `127.0.0.1`) und `.env` auf dem Produktionsserver (Strato).
  - Dynamisches Cookie-Flag `secure` in `get_stations.php` für reibungslosen Betrieb über HTTP (lokal) und HTTPS (Produktion).
  - Robuste Anzeige aller vier Dashboard-Bereiche in `statsPage.js`: Gesamte Hörzeit, Zuletzt gehört, Hörverlauf-Liniendiagramm, Top 5 Sender Balkendiagramm & Liste sowie Genre-Verteilung Doughnut-Chart rendern jetzt jederzeit stabil und informativ.
- **Service Worker & PWA Update v27:**
  - Cache-Version in `sw.js` auf `milo-radio-v27` angehoben und alle Versions-Parameter in `index.html` und `main.js` auf `v=27` synchronisiert.

## [1.5.3] - 2026-09-05

### Hinzugefügt / Verbessert (Analytics, Empfehlungen & 1-Klick Playlist)
- **Personalisierte Sender-Empfehlungen auf der Statistikseite (`statsPage.js`):**
  - Neue Sektion **"Empfehlungen für dich"** mit visuellen Senderkarten im Glassmorphism-Design.
  - Dynamische Erkennung des Lieblingsgenres basierend auf Analytics-Hördaten oder bestehenden Nutzer-Favoriten mit intelligentem Fallback auf beliebte Sender.
  - Ausschluss bereits vorhandener Top-6-Sender und meistgehörter Stationen, um stets frische Musikentdeckungen vorzuschlagen.
  - Direkte Interaktion auf den Empfehlungskarten: Direkt-Play (`▶ Play` / `Läuft`) und Schnellübernahme (`+ Zu Top 6` / `✓ In Top 6`).
- **1-Klick-Übernahme der Top 5 in die Playlist:**
  - Aktions-Button **"📥 Als Playlist übernehmen"** in der Top-5-Sender-Card.
  - Detail-Liste der Top-Sender mit Rang-Badges (#1 bis #5), Senderlogos, Gesamthördauer und Sofort-Wiedergabe.
  - Beim Klick werden die Top-Sender sofort in `userStationService` gespeichert und als aktive Favoritenliste geladen.
- **Floating Toast Notifications:**
  - Bestätigung von Übernahmen und Hinzufügungen mit Glassmorphism-Toast und Schnelllink *"Top 6 ansehen ➔"*.
- **Backend & Metadaten (`get_stats.php`):**
  - Bereitstellung vollständiger Metadaten (`id`, `sender_url`, `sender_logo`, `genre`, `now_playing_url`) für Top-Stationen.
- **Service Worker & PWA Update v26:**
  - Cache-Version in `sw.js` auf `milo-radio-v26` angehoben und alle Skript-/CSS-Versionen in `index.html` und `main.js` auf `v=26` aktualisiert.

## [1.5.2] - 2026-09-05

### Behoben / Verbessert (Favoriten-Verwaltung & Genre-UX)
- **Keine automatischen 6 Random-/Standard-Sender mehr:**
  - `userStationService.js`: Automatischer Fallback auf 6 feste Default-Sender (`DEFAULT_TOP6_STATIONS`) komplett entfernt. Wenn die Favoritenliste leer ist oder alle Sender entfernt werden, bleibt die Liste leer und der Nutzer sieht den dafür vorgesehenen Empty-State ("Deine Favoritenliste ist leer") mit Direktlink zu den Genres.
  - `main.js`: Automatisches Befüllen der Top-6 mit den ersten Sendern aus dem Master-Katalog bei App-Neustart (`initApp()`) entfernt.
- **Fokussierte Genre-Auswahl ohne vorherige Sender (`genresPage.js`):**
  - Beim Klick auf **"Genre wechseln"** werden die zuvor angezeigten Sender sofort aus der Ansicht entfernt und die Leiste des aktiven Genres temporär verborgen. Der Nutzer kann sich somit voll auf die Genre-Buttons konzentrieren, ohne dass alte Sender den Bildschirm auf Smartphones blockieren.
- **Korrektur Syntax & Initialisierung:**
  - `userStationService.js`: Nicht geschlossenen Kommentar-Tag (`*/`) behoben, der das Initialisieren der Module im Browser blockiert hatte.
  - `index.html` & `main.js`: Alle Skript-, CSS- und Modul-Versions-Parameter konsistent auf `v=25` angehoben für sofortiges Neuladen im Browser und der PWA.
- **Service Worker & PWA Update v25:** Cache-Version in `sw.js` auf `milo-radio-v25` angehoben für sofortiges Update auf Mobilgeräten.

## [1.5.1] - 2026-09-04

### Hinzugefügt / Verbessert (Admin UX & Mobile Optimization)
- **5 individuell einklappbare Bereiche im Admin-Panel (`adminPage.js`):**
  - **Live Hörer:** Klickbarer Header mit Chevron-Toggle zum Ein-/Ausblenden der Echtzeit-Höreranzeige.
  - **Datenbank-Status:** Klickbarer Header zum Ein-/Ausklappen der Tabellengröße und des Optimierungs-Buttons.
  - **Top 10 Sender (Beliebtheit):** Einklappbares Chart-Diagramm mit automatischem Re-Rendering (`chart.resize()`) beim Ausklappen.
  - **Sender hinzufügen / bearbeiten:** Einklappbares Formular zur Vermeidung von Vollbild-Überladung auf Smartphones. Automatisches Aufklappen (`Auto-Expand`) und sanftes Hinscrollen bei Klick auf „Edit“ eines Senders.
  - **Vorhandene Sender:** Eigene Card mit Gesamtanzahl-Badge, Genre-Buttons mit aktiver Hervorhebung und Senderkarten, vollständig ein- und ausklappbar.
- **Service Worker & PWA Update v24:** Cache-Version auf `milo-radio-v24` angehoben und `adminPage.js` explizit in den Cache aufgenommen.

## [1.5.0] - 2026-09-04

### Dokumentation
- **README.md auf Version 1.5.0 aktualisiert:**
  - Feature-Highlights um globale Sticky-Bottom-Player-Bar, Top-6-Favoriten-System (MRU & Auto-FIFO), Genre-Stöbern mit Vorhörfunktion und einklappbarer Leiste sowie die Einstellungsseite mit 1-Klick-Cache-Reset ergänzt.
  - Projektstruktur-Übersicht um alle SPA-Pages (`genresPage.js`, `settingsPage.js`), Components (`playerBar.js`), Services (`userStationService.js`, `stationServiceV5.js`, `radioServiceV2.js`) und Server-Fallbacks erweitert.
  - Versions-Badge (`v1.5.0`) hinzugefügt.

### Sicherheit
- **Entfernung sensibler Umgebungskonfigurationen aus dem Git-Tracking:**
  - `backend/.env.strato` und `backend/.env.remote` aus der Git-Versionsverwaltung entfernt (bleiben lokal erhalten).
  - `.gitignore` erweitert (`.env.*`, `**/.env.*`), um alle künftigen `.env`-Dateivarianten zuverlässig zu ignorieren, während `.env.example` als Vorlage erhalten bleibt.

### Behoben
- **PWA Installation & 403 Forbidden Fehler behoben:** 
  - `DirectoryIndex index.php index.html` in `.htaccess` ergänzt, sodass der Aufruf des Ordners `/frontend/` durch PWA-Starter oder Browser nicht mehr mit einem 403 Forbidden Fehler abbricht.
  - `start_url` im PWA `manifest.json` explizit auf `./index.html` gesetzt.
  - `frontend/index.php` als robuster Fallback hinzugefügt, falls ein Server auf `index.php` besteht.
  - Zugriffsberechtigungen in `.htaccess` für Apache 2.4 und 2.2 aktualisiert, damit `manifest.json` für mobile Browser und Web-App-Installation immer freigegeben ist.
  - Service Worker und Cache auf `v23` aktualisiert.

## [1.4.9] - 2026-09-03

### Hinzugefügt / Verbessert (Modern App Architecture)
- **Umstellung auf Best-Practice App-Design (Option 2):** Der separate Footer-Balken wurde entfernt. Die Player-Leiste schließt die App nun am unteren Rand absolut sauber und nativ ab.
- **Zentrale App-Verwaltung in Einstellungen (`#settings`):** Buttons für `Impressum & Datenschutz` (Modal) und `App aktualisieren / Cache leeren` sind jetzt übersichtlich und aufgeräumt in der Einstellungsseite integriert.
- **Service Worker & PWA Update v22:** Cache-Version auf `milo-radio-v22` aktualisiert.

## [1.4.8] - 2026-09-03

### Behoben
- **Footer-CSS-Spezifität & Bootstrap-Klassen-Korrektur:** `.py-3` vom `footer`-Element entfernt und `#app-footer, footer` Selektor mit `padding-bottom: 140px` definiert. Der Footer mit Impressum, Datenschutz und Reset-Button scrollt nun beim Erreichen des Seitenendes auf allen Bildschirmen einwandfrei ins Bild direkt über der festen Player-Leiste.
- **Service Worker & PWA Update v21:** Cache-Version auf `milo-radio-v21` aktualisiert.

## [1.4.7] - 2026-09-03

### Behoben
- **Footer-Positionierung am Seitenende:** `margin-bottom` am Footer vollständig entfernt (`margin-bottom: 0`). Der Footer sitzt jetzt wie gewünscht ganz unten am Seitenabschluss und wird erst beim Herunterscrollen an das Seitenende sichtbar, mit passendem Innen-Abstand (`padding-bottom: 95px`), damit die Links nahtlos über der Player-Leiste liegen.
- **Service Worker & PWA Update v20:** Cache-Version auf `milo-radio-v20` aktualisiert.

## [1.4.6] - 2026-09-03

### Hinzugefügt / Behoben
- **Flexibles Genre-Einklappen:** Neuer `Einklappen ▴` / `Ausklappen ▾`-Button direkt im Header der Musikrichtungs-Box, sodass die 20+ Genre-Buttons auch ohne vorherige Genre-Auswahl jederzeit manuell ein- oder ausgeklappt werden können.
- **Dauerhaft erreichbarer Footer:** `footer` mit `margin-bottom: 95px` ausgestattet, sodass Impressum, Datenschutz und Versionshinweis beim Herunterscrollen auf allen Geräten oberhalb der fixierten Player-Leiste frei sichtbar und anklickbar sind.
- **Service Worker & PWA Update v19:** Aktualisierung auf `milo-radio-v19`.

## [1.4.5] - 2026-09-03

### Behoben
- **Integrierte Standard-Favoriten:** `userStationService` enthält nun 6 feste Standard-Favoriten, falls der Speicher auf dem Smartphone noch leer ist oder zurückgesetzt wurde.
- **Sichtbarkeit von Kacheln auf mobilen Displays:** Generelles `padding-bottom: 150px` auf `#app-content` und `#genreContainer`, damit Karten bei kleineren Bildschirmhöhen niemals von der fixierten Player-Leiste überdeckt werden.
- **Sanfter Seitenanfang-Scroll bei Genre-Auswahl:** Die Seite scrollt beim Auswählen eines Genres nun sauber nach oben an den Anfang, anstatt den Inhalt über den sichtbaren Rand hinaus zu schieben.
- **Service Worker & PWA Update v18:** Cache-Version auf `milo-radio-v18` aktualisiert.

## [1.4.4] - 2026-09-03

### Hinzugefügt / Behoben
- **In-App Cache-Reset-Button im Footer:** Hinzufügen einer 1-Klick-Aktualisierungsfunktion (`App aktualisieren / Cache leeren`), die ServiceWorker-Caches, Cache-Storage und Session-Storage auf Smartphones automatisch leert und die neueste Version erzwingt.
- **Service Worker & PWA Update v17:** Strikte Network-First-Strategie für alle JavaScript-, HTML- und Versions-Anfragen.

## [1.4.3] - 2026-09-03

### Behoben
- **Null-Safety in `userStationService`, `genresPage` und `radioPage`:** Vollständige Absicherung gegen fehlerhafte oder leere `localStorage`-Einträge auf Mobilgeräten.
- **Automatischer Fallback auf Standard-Sender:** Sollte der mobile Speicher leer sein, lädt die App automatisch die ersten 6 Master-Sender, sodass keine leere Ansicht entsteht.
- **Service Worker & PWA Update v16:** Aktualisierung auf `milo-radio-v16`.

## [1.4.2] - 2026-09-03

### Behoben
- **Event-Entkopplung & Klick-Ausführung:** Asynchrone Entkopplung von UI-Render-Events (`setTimeout`), damit DOM-Elemente während laufender Klick- und Touch-Events auf mobilen Geräten nicht vorzeitig zerstört werden.
- **Normalisiertes URL-Matching:** Robuster URL-Abgleich in `userStationService` (Bereinigung von Protocol, trailing slashes, Groß-/Kleinschreibung) für 100% verlässliche Erkennung von Favoriten in allen Genres.
- **Service Worker & PWA Update v15:** Cache-Version auf `milo-radio-v15` angehoben.

## [1.4.1] - 2026-09-03

### Behoben
- **Network-First PWA Cache Strategie:** Der Service Worker nutzt für Navigation, HTML und JS-Dateien nun eine strikte Network-First-Strategie mit automatischem Reload bei Updates (`controllerchange`). Dadurch werden neue Features auf Smartphones sofort beim Öffnen geladen, ohne dass ein manuelles Löschen des Browser-Caches nötig ist.
- **Mobile Touch-Event-Optimierung & Audio Buffer Reset:** Direkte Ausführung von `play()` im Touch-Kontext sowie Bereinigung des Audio-Puffers beim Senderwechsel.

## [1.4.0] - 2026-09-03

### Hinzugefügt / Geändert
- **MRU-Sortierung beim Abspielen & Auto-Scroll:** Wird ein Sender auf der Radio-Player-Seite abgespielt, rückt dieser automatisch auf **Platz #1** (Position 1) vor. Die Ansicht scrollt sanft nach ganz oben (`window.scrollTo`), sodass der Nutzer sofort sieht, dass der laufende Sender jetzt auf Platz #1 liegt.
- **Einklappbare Genre-Auswahl mit Fokus-Modus:** Beim Auswählen eines Genres klappt die 20+ Button-Leiste automatisch zusammen und zeigt eine kompakte Statusleiste (`[🎵 Genre] • X Sender verfügbar [Genre wechseln ▾]`). Dadurch rücken die Senderkarten direkt in den Fokus, ohne den halben Bildschirm für Buttons zu blockieren.
- **Service Worker & PWA Update v12:** Cache-Version auf `milo-radio-v12` angehoben für sofortige Synchronisation auf Mobilgeräten.

## [1.3.0] - 2026-09-03

### Hinzugefügt / Geändert
- **Global persistente Sticky-Bottom-Player-Bar:** Die Player-Leiste ist nun app-weit über alle Seiten (Radio, Genres, Stats, Einstellungen, Admin) dauerhaft aktiv. Wiedergabe, Lautstärke und Now-Playing-Fetches laufen beim Stöbern in Genres nahtlos und unterbrechungsfrei weiter.
- **Direktes Play & Top-6-Hinzufügen in Genres:** Auf der Genres-Seite kann jeder Sender nun sowohl direkt Probe gehört (`Play` / `Läuft`) als auch zu den Top 6 (`+ Zu Top 6` / `✓ Platz X`) hinzugefügt werden.
- **Robuste Daten-Normalisierung:** Absicherung von Sender-URLs und Logo-Attributen in `userStationService`, sodass das Hinzufügen von Sendern unter allen Bedingungen fehlerfrei funktioniert.
- **Service Worker & PWA Update v10:** Aktualisierung auf `milo-radio-v10` mit automatischer Registrierung des neuen globalen `playerBar.js` Moduls.

## [1.2.0] - 2026-09-03

### Hinzugefügt / Geändert
- **Top 6 Favoriten-Limit mit Auto-FIFO:** Begrenzung der aktiven Senderliste auf maximal 6 Sender für ein aufgeräumtes, übersichtliches Dashboard ohne horizontales/vertikales Überladen.
- **Neueste Sender an Position 1:** Beim Hinzufügen eines Senders über die Genres-Seite wird dieser sofort an oberster Stelle (Index 0 / Position 1) eingefügt.
- **Automatisches Verdrängen alter Sender:** Sobald mehr als 6 Sender vorhanden sind, fällt der älteste Sender am Ende der Liste automatisch heraus. Bereits vorhandene Sender rücken bei erneuter Auswahl auf Platz 1 vor.
- **Interaktives Feedback in Genres:** Anzeige der aktuellen Position (`✓ Platz X`) und visuelle Rückmeldung beim Hinzufügen.
- **Service Worker & PWA Update v9:** Aktualisierung des Cache-Managements (`milo-radio-v9`) für sofortige Verfügbarkeit auf Mobilgeräten.

## [1.1.0] - 2026-09-03

### Geändert
- **Vereinte Sticky-Bottom-Player-Bar:** Zusammenführung der Wiedergabesteuerung (Play, Stop, Lautstärkeregler) und der Live-Now-Playing-Anzeige (Sender, Songtitel, Interpret, Sender-Artwork) in eine elegante, am unteren Bildschirmrand fixierte Leiste mit Glassmorphismus und animiertem Soundwave-Badge.
- **Footer-Layout:** Entfernung der `fixed-bottom`-Fixierung des Footers. Der Footer fließt nun natürlich am Seitenende (`mt-auto` im Flexbox-Layout) und verdeckt keine Inhalte mehr.
- **Responsives Scroll-Padding:** Automatischer Ausgleich des unteren Innenabstands (`padding-bottom`), sodass Senderkarten beim Durchscrollen vollständig sichtbar und erreichbar bleiben.

## [1.0.0] - 2026-09-03

### Hinzugefügt
- **Single Page Application (SPA):** Modulare Frontend-Architektur auf Basis von ES6-Modulen mit dynamischem Routing für Player, Genres, Statistiken, Admin-Bereich und Einstellungen.
- **Progressive Web App (PWA):** Vollwertige PWA-Unterstützung mit Service Worker (`sw.js`), Offline-Caching, Web-App-Manifest und App-Icons für mobile Endgeräte.
- **UX & Touch-Gesten:**
  - Flüssige Wischgesten (Swipe) zum Wechseln zwischen den Seiten auf Smartphones und Tablets.
  - Integrierter Randschutz (10 % Randbereich), um Konflikte mit nativen Systemgesten zu verhindern.
  - Modernes Dark-Design mit Glassmorphismus-Effekten und responsiven UI-Komponenten.
  - Vergrößerte Player-Anzeige (*Enlarged UI*) für Titel, Interpret und Cover auf Distanz (z. B. Wand-Tablets).
  - QR-Code-Sharing-Modal zum Teilen von Radiosendern.
- **Persönliche Statistiken & Deep Analytics:**
  - Tracking von Hörzeiten und Events über periodische Pings.
  - Interaktive Diagramme mit [Chart.js](https://www.chartjs.org/) für Hörverlauf (Linie), Top-5-Sender (Balken) und Genre-Verteilung (Doughnut).
  - Zeitfilter (Heute, Diese Woche, Dieser Monat).
- **Abgesichertes Admin-Panel:**
  - PIN-basierte Authentifizierung mit serverseitiger Session-Verwaltung.
  - Brute-Force-Schutz durch 1,5s Verzögerung und automatischen 5-Minuten-Lockout nach 5 Fehleingaben.
  - Sender-Verwaltung mit vollständigen CRUD-Operationen (Erstellen, Bearbeiten, Löschen).
  - Anzeige von Echtzeit-Hörern (letzte 10 Minuten) und Tabellenstatistiken.
- **Backend & RESTful APIs (PHP 8 & MySQL/MariaDB):**
  - REST-Endpunkte für Authentifizierung (`auth.php`), Senderlisten (`get_stations.php`), Metadaten (`metadata.php`), Event-Pings (`ping.php`) und Statistiken (`get_stats.php`, `get_admin_stats.php`).
  - Sichere Datenbankanbindung über PHP Data Objects (PDO) mit `.env`-Konfiguration.
  - Initialisierungs- und Datenbankschemata (`init_local_db.sql`, `db_schema_mysql.sql`) inkl. Import-Skript (`import_json_to_db.php`).
- **Wartung & Datenbankbereinigung:**
  - Automatisiertes Archivierungssystem (`maintenance.php`) für Hörer-Events älter als 6 Monate in die Tabelle `archived_stats`.
  - Datenbank-Optimierung (`OPTIMIZE TABLE`) und Absicherung des Wartungs-Endpunkts via `CRON_TOKEN`.
- **Sicherheits- und Serverkonfiguration:**
  - `.htaccess`-Regeln zur Blockierung des Zugriffs auf `.env`, Konfigurationsdateien, Git-Ordner und JSON-Dateien sowie Deaktivierung des Directory-Listings.
  - `.gitignore`-Konfiguration für sensible Konfigurationen (`.env`, `.ini`).
- **Dokumentation:**
  - Umfassende [README.md](README.md) mit Feature-Übersicht, JS-Architektur und Installationsanleitung für lokale Entwicklungsumgebungen (XAMPP / HeidiSQL).
