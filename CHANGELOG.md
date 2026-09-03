# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

---

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
