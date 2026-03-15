# Milo Radio App

Milo Radio ist eine moderne, progressive Web-App (PWA) zum Streamen deiner Lieblingsradiosender. Die App wurde vollständig refactoriert und bietet eine saubere Trennung zwischen Frontend und Backend sowie fortschrittliche Echtzeit-Analysen.

## Live Demo

Die App ist live erreichbar unter: **[milo-radio.de](https://milo-radio.de)**

## Neue Highlights: Deep Analytics & Design

- **Analytics Deep-Dive**: Verfolge dein Hörverhalten über verschiedene Zeiträume (Heute, Woche, Monat).
- **Interaktive Charts**: 
  - **Hörverlauf**: Ein Line-Chart zeigt deine Aktivität über die Zeit.
  - **Top 5 Sender**: Ein dynamisches Balkendiagramm deiner meistgehörten Sender.
  - **Genre-Verteilung**: Ein Doughnut-Chart visualisiert deine musikalischen Vorlieben.
- **Enlarged Player UI**: Der aktuelle Song und Interpret werden nun besonders groß und leserlich im Player dargestellt – ideal für die Nutzung aus der Ferne oder auf dem Tablet.
- **QR-Code Sharing**: Integriertes Logo-Modal für blitzschnelles Teilen.
- **Premium Dark Design**: Glassmorphism-Effekte, flüssige Animationen und ein konsistentes modernes Farbschema.

## Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3, Bootstrap 5.
- **Backend**: PHP 8.x (REST-API) mit PDO-Anbindung.
- **Datenbank**: MariaDB/MySQL (optimiert für Strato-Kompatibilität).
- **Visualisierung**: Chart.js für die interaktiven Dashboard-Statistiken.

## Projektstruktur

- **/frontend**: Client-Logik, Styles, Assets und PWA-Service-Worker.
- **/backend**: API-Endpunkte, Datenbank-Logic und Konfiguration.
  - **/api**: REST-Endpunkte für Stations, Stats und Metadata.
- **/index.php**: Zentraler Einstiegspunkt mit automatischem Routing.

## Installation & Lokale Entwicklung

Für die lokale Entwicklung und das Testen der Datenbank-Features wird folgendes Setup empfohlen:

1. **Repository klonen** und in den Webserver-Root legen (z.B. XAMPP `htdocs`).
2. **Datenbank-Tool**: Wir empfehlen **HeidiSQL** (Windows) für die lokale Verwaltung der MariaDB. Es ist schneller und leistungsfähiger als phpMyAdmin.
3. **Setup**:
   - Starte Apache und MySQL in XAMPP.
   - Importiere die `backend/init_local_db.sql` via HeidiSQL, um die Struktur und Testdaten anzulegen.
   - Kopiere `backend/.env.example` nach `backend/.env` und trage deine lokalen Zugangsdaten ein (Standard: `root`, kein Passwort).
4. **Import**: Führe die `backend/api/import_json_to_db.php` einmalig im Browser aus, um deine eigenen Sender aus der JSON-Datei in die Datenbank zu laden.

## Autor

**José Luis Juárez** - Angehender Anwendungsentwickler aus Hamburg.

---

© 2026 Milo Radio • **Premium Radio Experience**
