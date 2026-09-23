# Milo Radio App

[![Version](https://img.shields.io/badge/Version-1.7.0-blue?style=flat-square)](#)
[![PWA](https://img.shields.io/badge/PWA-Progressive%20Web%20App-purple?style=flat-square&logo=pwa)](https://developer.mozilla.org/de/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JS-Vanilla%20ES6-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/de/docs/Web/JavaScript)
[![PHP](https://img.shields.io/badge/PHP-8.x-blue?style=flat-square&logo=php)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)](#)

Milo Radio ist eine moderne, Progressive Web App (PWA) zum Streamen deiner Lieblingsradiosender und Podcasts. Das Projekt besticht durch eine saubere Trennung von Frontend (Single Page Application SPA) und Backend (REST-API), eine performante Echtzeit-Statistik, weltweite Sendersuche sowie ein voll ausgestattetes, abgesichertes Admin-Panel.

> [!NOTE]
> **Live Demo:** Die App ist live erreichbar unter: **[milo-radio.de](https://milo-radio.de)**

---

## Features & Highlights

### Design & Player-Erlebnis (UX/UI)

- **Globale Sticky-Bottom-Player-Bar (Spotify-Style):** Unterbrechungsfreie Audiowiedergabe über alle Seiten (Radio, Genres, Stats, Einstellungen, Admin) mit Now-Playing-Anzeige (Sender, Titel, Interpret, Cover), animiertem Soundwave-Badge und Lautstärkeregler.
- **Top 6 Favoriten-System (MRU & Auto-FIFO):**
  - Schlankes Dashboard mit maximal 6 aktiven Lieblingssendern für optimale Übersicht ohne Überladung.
  - **MRU-Sortierung beim Abspielen:** Der laufende Sender rückt automatisch auf **Platz #1** vor, begleitet von einem sanften Auto-Scroll an den Seitenanfang.
  - **Auto-FIFO beim Hinzufügen:** Neu ausgewählte Sender werden auf Platz 1 eingefügt; ab 6 Sendern fällt der älteste automatisch heraus.
- **Genre-Stöbern & Direktes Vorhören:**
  - Über 20 Musikrichtungen mit direktem Vorhören (`Play` / `Läuft`) und Übernahme in die Top 6 (`✓ Platz X`).
  - **Einklappbare Genre-Leiste:** Manuelles `Einklappen ▴` / `Ausklappen ▾` der Genre-Buttons für maximalen Fokus auf die Senderkarten.
- **Enlarged Player UI:** Extra große Anzeige von Songtitel, Interpret und Album-Cover – perfekt lesbar auf Distanz (z. B. auf dem Wand-Tablet).
- **QR-Code-Sharing:** Generiere und teile Sender-Links direkt per Knopfdruck über ein integriertes QR-Code-Modal.
- **SPA Swipe-Gesten:** Schnelles Wischen (links/rechts) auf Touchscreens zwischen allen Seiten mit 10 % Randschutz zur Vermeidung nativer Smartphone-Gestenkonflikte.

### Podcast-Integration & On-Demand Audio

Podcasts sind fundamental anders als klassische Live-Radiosender: Statt eines fortlaufenden Dauer-Streams hören Nutzer gezielte Episoden on demand. Milo Radio unterscheidet dies vollautomatisch:
- **Echtes Pause & Resume mit Zeiterhalt:** Beim Pausieren eines Podcasts bleibt die genaue Abspielposition (`currentTime`) erhalten. Beim erneuten Starten läuft die Episode exakt an der unterbrochenen Stelle weiter, statt von vorn zu beginnen.
- **Interaktive Timeline & Scrubber:** Sobald ein Podcast abgespielt wird, schaltet der Player dynamisch eine sekundengenaue Zeitleiste mit aktueller Spielzeit und Gesamtlaufzeit frei.
- **15-Sekunden Quick-Skip:** Schnelles Vor- und Zurückspulen (`-15s` / `+15s`) per Fingertipp, um Textpassagen zu wiederholen oder Intros zu überspringen.
- **Episodenauswahl („Weitere Folgen“):** Auf den Podcast-Karten in der Genre-Übersicht steht neben dem Sofortstart der neuesten Episode ein Button für weitere Folgen bereit. Eine einklappbare Liste zeigt die letzten Episoden mit Veröffentlichungsdatum, Laufzeit und individuellem Play-Button.

### Zentrale App-Einstellungen & PWA

- **Einstellungsseite (`#settings`):** Zentrale Anlaufstelle für App-Informationen, Impressum und Datenschutz.
- **1-Klick Cache-Reset:** `App aktualisieren / Cache leeren` leert Service-Worker-Caches, CacheStorage und SessionStorage für sofortige Aktualisierungen auf Mobilgeräten.
- **Progressive Web App (PWA):** Vollwertige PWA mit Offline-Fallback, Web-App-Manifest und Network-First-Caching (Service Worker `v37`) für rasante Ladezeiten und sofortige Updates.

### Deep Analytics & Dashboard

- **Persönliche Statistiken:** Verfolge dein Hörverhalten über verschiedene Intervalle (Heute, Woche, Monat).
- **Interaktive Visualisierung (Chart.js):**
  - _Hörverlauf:_ Line-Chart zur Darstellung deiner stündlichen/täglichen Aktivität.
  - _Top 5 Sender:_ Dynamisches Balkendiagramm der meistgehörten Stationen.
  - _Genre-Verteilung:_ Doughnut-Chart zur Visualisierung deiner musikalischen Vorlieben.

### Sicherheit & Schutz

- **Abgesichertes Admin-Panel:** Zugriff auf das Admin-Dashboard ist durch eine PIN geschützt.
- **Brute-Force-Schutz:**
  - Künstliche Verzögerung von 1,5 Sekunden bei der PIN-Prüfung, um automatisierte Angriffe zu erschweren.
  - Temporäre 5-Minuten-Sperre (Lockout) nach 5 aufeinanderfolgenden Fehleingaben.
- **Datenschutz & Webserver-Absicherung:**
  - Sensible Zugangsdaten sind in einer geschützten `.env`-Datei hinterlegt.
  - Die [.htaccess](file:///c:/github/milo-radio/.htaccess) blockiert den direkten Zugriff auf `.env`, JSON-Datendateien, Git-Konfigurationen und Assistant-Datenordner, und schützt vor Directory-Browsing.

### Admin-Dashboard & Smarte Senderverwaltung

Das Admin-Panel macht das Verwalten und Hinzufügen neuer Audioquellen intuitiv und schnell – ohne dass Stream-URLs mühsam manuell recherchiert werden müssen:

- **Weltweite Online-Radiosendersuche (> 40.000 Sender):**
  - Integrierte Radio-Browser-Schnittstelle direkt im Admin-Bereich.
  - Einfach den Sendernamen eingeben (egal ob regional oder international wie z. B. „Rock Antenne“, „1LIVE“, „Sunshine Live“, „BBC“).
  - Trefferliste zeigt Senderlogo, Musikrichtung, Bitrate/Codec und das **Herkunftsland** an (hilft sofort bei der Unterscheidung von Sendern mit identischem Namen in verschiedenen Ländern).
  - **1-Klick Auto-Fill:** Ein Klick auf „Übernehmen“ überträgt Sendername, Audio-Stream-URL, Genre und Sender-Logo direkt in das Speicherformular.
- **1-Klick Podcast-Auto-Import:**
  - Eingabe einer RSS-Feed-URL oder eines Podigee-Links.
  - Das Backend liest Channel-Titel, Beschreibung, Cover-Grafik und die Stream-URL der neuesten Folge automatisch aus und füllt alle Felder mit einem Klick aus.
- **5 individuell einklappbare Bereiche:** Live Hörer, Datenbank-Status, Top-10-Sender-Chart, Sender-Formular und Vorhandene Sender lassen sich per Klick einzeln ein- und ausklappen für maximale Übersicht auf Smartphones. Bei Klick auf „Edit“ öffnet sich das Formular automatisch (`Auto-Expand`).
- **Echtzeit-Hörer:** Zeigt die Anzahl der aktiven Hörer in den letzten 10 Minuten an.
- **Datenbank-Status & Optimierung:** Zeigt die aktuelle Tabellengröße an und bietet einen Button zur sofortigen Datenbankbereinigung.
- **Sender-Verwaltung (CRUD):** Sender direkt im Browser hinzufügen, bearbeiten oder löschen mit persistenter Speicherung in der MySQL-Datenbank.
- **Wartungs-Cronjob:** Die Schnittstelle `maintenance.php` bereinigt Hörer-Events älter als 6 Monate, verdichtet sie in die Archiv-Tabelle `archived_stats` und führt ein `OPTIMIZE TABLE` durch. Sie kann über externe Cronjobs per `CRON_TOKEN` getriggert werden.

---

## Technologie-Stack

- **Frontend:** Vanilla HTML5, CSS3 (Custom CSS & Glassmorphismus), [Bootstrap 5](https://getbootstrap.com/), Vanilla JS (ES Modules), [Chart.js](https://www.chartjs.org/) (Diagramme).
- **Backend:** [PHP 8.x](https://www.php.net/) (RESTful API), PDO für sichere SQL-Verbindungen, cURL & XML-Parser für Feeds und Radiosuche.
- **Datenbank:** MySQL / MariaDB (für hervorragende Strato-Kompatibilität).

---

## Projektstruktur

```text
milo-radio/
├── frontend/                     # Client-Anwendung (HTML, CSS, JS, Assets)
│   ├── index.html                # Haupt-Einstiegspunkt (Single Page App)
│   ├── index.php                 # Server-Fallback für PWA- & Webserver-Routing
│   ├── manifest.json             # PWA Web-App-Manifest
│   ├── sw.js                     # Service Worker (Network-First, Cache v37)
│   ├── css/                      # Stylesheets (Bootstrap & Custom Glassmorphism Theme)
│   ├── images/                   # Sender-Logos, PWA-Icons & SVGs
│   └── js/                       # Modulare ES6-Architektur
│       ├── main.js               # App-Initialisierung, SPA-Router, Gestensteuerung
│       ├── components/           # Wiederverwendbare UI-Komponenten
│       │   └── playerBar.js      # Globale Sticky-Bottom-Player-Bar mit Podcast-Controls
│       ├── pages/                # Seiten-Module der SPA
│       │   ├── radioPage.js      # Radio-Player mit Top-6-Favoriten
│       │   ├── genresPage.js     # Genre-Übersicht, Stöbern, Vorhören & Episodenliste
│       │   ├── statsPage.js      # Persönliches Statistik-Dashboard (Chart.js)
│       │   ├── settingsPage.js   # Einstellungen, 1-Klick Cache-Reset, Impressum
│       │   └── adminPage.js      # Abgesichertes Admin-Panel mit Suchmaschine & Import
│       └── services/             # Geschäftslogik & API-Services
│           ├── userStationService.js # Verwaltung der Top-6-Sender (LocalStorage, MRU/FIFO)
│           ├── stationServiceV5.js   # Laden, Caching & CRUD aller Radiosender
│           ├── podcastService.js     # Erkennung, Episoden-Auflösung & Podcast-Status
│           └── radioServiceV2.js     # Audio-Streaming, Playback-Status, Timeline & Pings
├── backend/                      # Server-Logik & REST-API
│   ├── api/                      # REST-Endpunkte
│   │   ├── auth.php              # PIN-Prüfung mit Brute-Force-Lockout & HMAC-Cookie
│   │   ├── get_stations.php      # Senderdatenbank abrufen
│   │   ├── manage_station.php    # CRUD-Endpunkt für Senderverwaltung
│   │   ├── radio_search.php      # Live-Suche im weltweiten Radio-Browser (>40k Sender)
│   │   ├── podcast.php           # RSS-Feed Resolver mit Caching & Episoden
│   │   ├── get_stats.php         # Persönliche Hörerstatistiken abrufen
│   │   ├── get_admin_stats.php   # Admin-Statistiken (Echtzeit-Hörer, DB-Größe)
│   │   ├── metadata.php          # Live Now-Playing ICY-Metadaten & Cover
│   │   ├── ping.php              # Hörer-Pings zur Nutzungsanalyse
│   │   ├── trends.php            # Trend-Analysen
│   │   ├── maintenance.php       # DB-Wartung, 6-Monats-Archivierung & OPTIMIZE
│   │   ├── import_json_to_db.php # JSON-Sender in MySQL importieren
│   │   └── db.php                # PDO-Datenbankverbindung
│   ├── db_schema_mysql.sql       # Tabellen-Schema für MySQL/MariaDB
│   ├── init_local_db.sql         # Lokales Initialisierungs-Skript inkl. Testdaten
│   └── .env.example              # Vorlage für Datenbank- & Admin-Zugangsdaten
├── .htaccess                     # Apache-Sicherheitsregeln, DirectoryIndex & Schutz
├── index.php                     # Root-Einstiegspunkt (Weiterleitung auf /frontend/)
├── CHANGELOG.md                  # Versions- und Änderungsprotokoll
└── README.md                     # Projektdokumentation
```

---

## Installation & Lokale Entwicklung

Für die lokale Ausführung und Entwicklung wird eine lokale Serverumgebung wie **XAMPP** empfohlen:

### 1. Repository klonen

Klone das Repository in das Root-Verzeichnis deines Webservers (z. B. `C:/xampp/htdocs/milo-radio`).

### 2. Datenbank aufsetzen

Wir empfehlen **HeidiSQL** (unter Windows) als performante Alternative zu phpMyAdmin.

1. Starte den MySQL/MariaDB-Dienst in deinem XAMPP Control Panel.
2. Verbinde dich per HeidiSQL mit deinem lokalen SQL-Server.
3. Importiere die Datei [init_local_db.sql](file:///c:/github/milo-radio/backend/init_local_db.sql). Dadurch wird die Datenbank `milo_radio` mitsamt allen benötigten Tabellen (`stations`, `users`, `listen_events`, `archived_stats`) und einigen Testsendern erstellt.

### 3. Konfiguration anpassen

1. Navigiere in den Ordner [backend/](file:///c:/github/milo-radio/backend).
2. Kopiere die Datei [.env.example](file:///c:/github/milo-radio/backend/.env.example) und benenne sie um in `.env`.
3. Trage deine Zugangsdaten und Einstellungen ein (Standardwerte für XAMPP sind bereits eingetragen):
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=milo_radio
   DB_USER=root
   DB_PASSWORD=
   ADMIN_PIN=1234
   CRON_TOKEN=dein_geheimes_wartungs_token
   ```

### 4. Eigene Sender importieren (optional)

Wenn du deine Radiosender in einer JSON-Datei hast, kannst du den Import-Endpunkt aufrufen:

1. Melde dich im Frontend als Admin an (PIN aus deiner `.env`).
2. Rufe das Skript `backend/api/import_json_to_db.php` einmalig im Browser auf, um deine Sender aus der JSON-Datei in die Datenbank zu importieren.

---

## Autor

**José Luis Juárez** - Angehender Anwendungsentwickler aus Hamburg.

---

© 2026 Milo Radio • **Premium Radio Experience**
