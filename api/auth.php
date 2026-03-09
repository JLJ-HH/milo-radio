<?php
/**
 * AUTHENTIFIZIERUNGS-API
 * 
 * Diese Datei verwaltet den Admin-Login, Logout und die Prüfung des Login-Status.
 * Sie verwendet eine PIN, die in einer geschützten .env-Datei gespeichert ist.
 */

// ============================================================
// 1. INITIALISIERUNG UND KONFIGURATION
// ============================================================

// CSRF-Schutz und Sessions aktivieren, um Login-Status über Seitenaufrufe hinweg zu speichern
session_start();

// CORS-Header setzen, um Anfragen von verschiedenen Ursprüngen (z.B. lokale Entwicklung) zu erlauben
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, DELETE');

// ============================================================
// 2. LADEN DER UMGEBUNGSVARIABLEN (.env)
// ============================================================

// Pfad zur .env-Datei (Sollte im 'private' Ordner liegen)
$envPath = __DIR__ . '/../../private/.env';

// Wenn eine .env-Datei gefunden wurde, laden wir die ADMIN_PIN
if (file_exists($envPath)) {
    $env = parse_ini_file($envPath);
    $realPin = isset($env['ADMIN_PIN']) ? trim($env['ADMIN_PIN']) : null;
}
else {
    // Falls keine Konfiguration gefunden wurde, geben wir einen Fehler aus
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => '.env Datei nicht gefunden']);
    exit;
}

// ============================================================
// 3. ANFRAGE-HANDLER (ROUTING)
// ============================================================

/**
 * GET: Prüfen, ob der Admin aktuell eingeloggt ist
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Gibt zurück, ob die Session-Variable 'isAdmin' auf true gesetzt ist
    echo json_encode(['success' => $_SESSION['isAdmin'] ?? false]);
    exit;
}

/**
 * POST: Benutzer möchte sich mit einer PIN einloggen
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // JSON-Eingabe aus dem Request-Body lesen
    $input = json_decode(file_get_contents('php://input'), true);
    $userPin = $input['pin'] ?? '';

    // Eingegebene PIN mit der PIN aus der .env vergleichen
    if ($userPin === $realPin) {
        // Erfolg: Login in der Session vermerken
        $_SESSION['isAdmin'] = true;
        echo json_encode(['success' => true]);
    }
    else {
        // Fehler: PIN ist falsch
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Falscher PIN']);
    }
    exit;
}

/**
 * DELETE: Admin möchte sich ausloggen
 */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Session komplett zerstören, um alle Login-Daten zu löschen
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Falls eine nicht unterstützte Methode (z.B. PUT) aufgerufen wird
http_response_code(405);
echo json_encode(['error' => 'Methode nicht erlaubt']);
?>
