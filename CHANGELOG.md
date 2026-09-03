# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

---

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
