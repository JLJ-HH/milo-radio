# Milo Radio App

Milo Radio ist eine moderne, progressive Web-App (PWA) zum Streamen deiner Lieblingsradiosender. Die App wurde komplett refactoriert und bietet nun eine strikte Trennung zwischen Frontend und Backend sowie fortschrittliche Statistiken.

## Live Demo

Die App ist live erreichbar unter: **[milo-radio.de](https://milo-radio.de)**

## Features

- **Multi-Genre Player**: Große Auswahl an Sendern, präsentiert in einer für Mobilgeräte optimierten Kachel- oder Listenansicht.
- **Statistik-Dashboard**: Verfolge dein Hörverhalten mit interaktiven Charts (Top-Sender, Hörzeit heute).
- **QR-Code Sharing**: Teile die App blitzschnell über ein integriertes Logo-Modal.
- **Echtzeit-Metadaten**: PHP-gestützter Proxy für aktuelle Song-Informationen ohne CORS-Probleme.
- **Premium UI/UX**: Modernes Dark-Design mit Glassmorphism-Effekten und flüssigen Animationen.
- **PWA-Support**: Vollständig installierbar als App auf Android und iOS (Offline-Caching inklusive).
- **Zentrale DB-Steuerung**: Alle Sender und Statistiken werden in einer SQL-Datenbank verwaltet.

## Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3, Bootstrap 5.
- **Backend**: PHP 8.x (REST-API), MariaDB/MySQL für Analytics & Content.
- **Visualisierung**: Chart.js für interaktive Dashboard-Statistiken.

## Projektstruktur

Das Projekt folgt einer klaren Architektur:

- **/frontend**: Client-Logik, Styles, Assets und PWA-Service-Worker.
- **/backend**: API-Endpunkte, Datenbankanbindung via PDO und `.env` Konfiguration.
- **/index.php**: Zentraler Einstiegspunkt mit automatischem Routing.

## Installation (Lokal)

1. Repository klonen oder herunterladen.
2. Projekt in den Webserver-Root legen (z.B. XAMPP `htdocs`).
3. Datenbank konfigurieren:
   - Erstelle eine MariaDB/MySQL Datenbank.
   - Importiere die Datei `backend/db_schema_mysql.sql`.
   - Kopiere `backend/.env.example` nach `backend/.env` und trage deine Zugangsdaten ein.
4. Die App über `http://localhost/milo-radio` aufrufen.

---

© 2026 Milo Radio • **Premium Radio Experience**
