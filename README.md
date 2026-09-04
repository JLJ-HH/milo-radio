# Milo Radio App

[![Version](https://img.shields.io/badge/Version-1.5.0-blue?style=flat-square)](#)
[![PWA](https://img.shields.io/badge/PWA-Progressive%20Web%20App-purple?style=flat-square&logo=pwa)](https://developer.mozilla.org/de/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JS-Vanilla%20ES6-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/de/docs/Web/JavaScript)
[![PHP](https://img.shields.io/badge/PHP-8.x-blue?style=flat-square&logo=php)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)](#)

Milo Radio ist eine moderne, Progressive Web App (PWA) zum Streamen deiner Lieblingsradiosender. Das Projekt besticht durch eine saubere Trennung von Frontend (Single Page Application SPA) und Backend (REST-API), eine performante Echtzeit-Statistik sowie ein voll ausgestattetes, abgesichertes Admin-Panel.

> [!NOTE]
> **Live Demo:** Die App ist live erreichbar unter: **[milo-radio.de](https://milo-radio.de)**

---

## Features & Highlights

### Design & Player-Erlebnis (UX/UI)

- **Globale Sticky-Bottom-Player-Bar (Spotify-Style):** Unterbrechungsfreie Musikwiedergabe über alle Seiten (Radio, Genres, Stats, Einstellungen, Admin) mit Now-Playing-Anzeige (Sender, Titel, Interpret, Cover), animiertem Soundwave-Badge und Lautstärkeregler.
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

### Zentrale App-Einstellungen & PWA

- **Einstellungsseite (`#settings`):** Zentrale Anlaufstelle für App-Informationen, Impressum und Datenschutz.
- **1-Klick Cache-Reset:** `App aktualisieren / Cache leeren` leert Service-Worker-Caches, CacheStorage und SessionStorage für sofortige Aktualisierungen auf Mobilgeräten.
- **Progressive Web App (PWA):** Vollwertige PWA mit Offline-Fallback, Web-App-Manifest und Network-First-Caching (Service Worker `v23`) für rasante Ladezeiten und sofortige Updates.

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

### Admin-Dashboard & Wartung

- **Echtzeit-Hörer:** Zeigt die Anzahl der aktiven Hörer in den letzten 10 Minuten an.
- **Datenbank-Status & Optimierung:** Zeigt die aktuelle Tabellengröße an und bietet einen Button zur sofortigen Datenbankbereinigung.
- **Sender-Verwaltung (CRUD):** Sender direkt im Browser hinzufügen, bearbeiten oder löschen.
- **Wartungs-Cronjob:** Die Schnittstelle `maintenance.php` bereinigt Hörer-Events älter als 6 Monate, verdichtet sie in die Archiv-Tabelle `archived_stats` und führt ein `OPTIMIZE TABLE` durch. Sie kann über externe Cronjobs per `CRON_TOKEN` getriggert werden.

---

## Technologie-Stack

- **Frontend:** Vanilla HTML5, CSS3 (Custom CSS & Glassmorphismus), [Bootstrap 5](https://getbootstrap.com/), Vanilla JS (ES Modules), [Chart.js](https://www.chartjs.org/) (Diagramme).
- **Backend:** [PHP 8.x](https://www.php.net/) (RESTful API), PDO für sichere SQL-Verbindungen.
- **Datenbank:** MySQL / MariaDB (für hervorragende Strato-Kompatibilität).

---

## Projektstruktur

```text
milo-radio/
├── frontend/                     # Client-Anwendung (HTML, CSS, JS, Assets)
│   ├── index.html                # Haupt-Einstiegspunkt (Single Page App)
│   ├── index.php                 # Server-Fallback für PWA- & Webserver-Routing
│   ├── manifest.json             # PWA Web-App-Manifest
│   ├── sw.js                     # Service Worker (Network-First, Cache v23)
│   ├── css/                      # Stylesheets (Bootstrap & Custom Glassmorphism Theme)
│   ├── images/                   # Sender-Logos, PWA-Icons & SVGs
│   └── js/                       # Modulare ES6-Architektur
│       ├── main.js               # App-Initialisierung, SPA-Router, Gestensteuerung
│       ├── components/           # Wiederverwendbare UI-Komponenten
│       │   └── playerBar.js      # Globale, persistente Sticky-Bottom-Player-Bar
│       ├── pages/                # Seiten-Module der SPA
│       │   ├── radioPage.js      # Radio-Player mit Top-6-Favoriten
│       │   ├── genresPage.js     # Genre-Übersicht, Stöbern, Vorhören & Hinzufügen
│       │   ├── statsPage.js      # Persönliches Statistik-Dashboard (Chart.js)
│       │   ├── settingsPage.js   # Einstellungen, 1-Klick Cache-Reset, Impressum
│       │   └── adminPage.js      # Abgesichertes Admin-Panel (CRUD, Stats, Wartung)
│       └── services/             # Geschäftslogik & API-Services
│           ├── userStationService.js # Verwaltung der Top-6-Sender (LocalStorage, MRU/FIFO)
│           ├── stationServiceV5.js   # Laden, Caching & Filtern aller Radiosender
│           └── radioServiceV2.js     # Audio-Streaming, Playback-Status & Ping-Tracking
├── backend/                      # Server-Logik & REST-API
│   ├── api/                      # REST-Endpunkte
│   │   ├── auth.php              # PIN-Prüfung mit Brute-Force-Lockout & Session
│   │   ├── get_stations.php      # Senderdatenbank abrufen
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
