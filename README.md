# Milo Radio App

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

### Design & Bedienung (UX/UI)

- **Premium Dark Design:** Moderner Glassmorphismus-Look, flüssige CSS-Übergänge und ein stimmiges dunkles Farbschema.
- **Enlarged Player UI:** Eine extra große Anzeige von Songtitel, Interpret und Album-Cover – perfekt lesbar auf Distanz (z. B. auf dem Tablet oder an der Wand).
- **QR-Code-Sharing:** Generiere und teile Sender-Links direkt per Knopfdruck über ein integriertes QR-Code-Modal.
- **SPA Swipe-Gesten:** Navigiere auf Mobilgeräten nahtlos durch Wischen (links/rechts) zwischen den Seiten (Radio ↔ Genres ↔ Meine Stats ↔ Admin ↔ Einstellungen).
  - _Randschutz:_ Wischgesten in den äußeren 10 % des Bildschirms werden ignoriert, um Konflikte mit den systemeigenen Zurück-Gesten der Smartphones zu verhindern.

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
  - Die [.htaccess](file:///c:/github/milo-radio/.htaccess) blockiert den direkten Zugriff auf `.env`, JSON-Datendateien, Git-Konfigurationen und Assistant-Datenordner, und deaktiviert das Directory-Browsing.

### Admin-Dashboard & Wartung

- **Echtzeit-Hörer:** Zeigt die Anzahl der aktiven Hörer in den letzten 10 Minuten an.
- **Datenbank-Status & Optimierung:** Zeigt die aktuelle Größe der Tabellen an und bietet einen Button zur sofortigen Datenbankbereinigung.
- **Sender-Verwaltung (CRUD):** Sender direkt im Browser hinzufügen, bearbeiten oder löschen.
- **Wartungs-Cronjob:** Die Schnittstelle `maintenance.php` bereinigt Hörer-Events älter als 6 Monate, verdichtet sie in die Archiv-Tabelle `archived_stats` und führt ein `OPTIMIZE TABLE` durch. Sie kann über externe Cronjobs per `CRON_TOKEN` getriggert werden.

---

## Technologie-Stack

- **Frontend:** Vanilla HTML5, CSS3 (Custom CSS & Glassmorphismus), [Bootstrap 5](https://getbootstrap.com/), Vanilla JS (ES Modules), [Chart.js](https://www.chartjs.org/) (Diagramme).
- **Backend:** [PHP 8.x](https://www.php.net/) (RESTful API), PDO für sichere SQL-Verbindungen.
- **Datenbank:** MySQL / MariaDB (für hervorragende Strato-Kompatibilität).

---

## Projektstruktur

- [frontend/](file:///c:/github/milo-radio/frontend) — Client-Anwendung (HTML, CSS, JS, Assets).
  - [index.html](file:///c:/github/milo-radio/frontend/index.html) — Haupt-Einstiegspunkt (Single Page App).
  - [js/](file:///c:/github/milo-radio/frontend/js) — JS-Architektur mit SPA-Router, Services und Seiten-Modulen:
    - [radioPage.js](file:///c:/github/milo-radio/frontend/js/pages/radioPage.js) — Die Hauptseite des Players für die Radiostreams.
    - [adminPage.js](file:///c:/github/milo-radio/frontend/js/pages/adminPage.js) — Das Admin-Verwaltungs-Dashboard.
    - [statsPage.js](file:///c:/github/milo-radio/frontend/js/pages/statsPage.js) — Das persönliche Statistik-Dashboard (Chart.js).
  - [sw.js](file:///c:/github/milo-radio/frontend/sw.js) — Service Worker für Offline-Caching und PWA-Funktionalität.
- [backend/](file:///c:/github/milo-radio/backend) — Server-Logik und Datenbank-Skripte.
  - [api/](file:///c:/github/milo-radio/backend/api) — REST-Endpunkte (Authentifizierung, Sender, Statistiken, Wartung, Metadaten).
  - [init_local_db.sql](file:///c:/github/milo-radio/backend/init_local_db.sql) — SQL-Skript zur lokalen Datenbank-Initialisierung (inklusive Testdaten).
  - [db_schema_mysql.sql](file:///c:/github/milo-radio/backend/db_schema_mysql.sql) — Datenbankstruktur-Schema für MySQL/MariaDB.
- [index.php](file:///c:/github/milo-radio/index.php) — Einstiegspunkt im Root-Verzeichnis (weiterleitend auf das Frontend).
- [.htaccess](file:///c:/github/milo-radio/.htaccess) — Sicherheitskonfiguration für Apache-Webserver.

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
