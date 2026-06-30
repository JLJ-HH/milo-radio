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

// Pfad zur .env-Datei (im backend Ordner)
$envPath = __DIR__ . '/../.env';

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

    // Prüfen, ob der Login aktuell wegen zu vieler Fehlversuche gesperrt ist
    if (isset($_SESSION['lockout_until']) && $_SESSION['lockout_until'] > time()) {
        $remaining = $_SESSION['lockout_until'] - time();
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => "Zu viele Fehlversuche. Login vorübergehend gesperrt. Bitte warte noch $remaining Sekunden."]);
        exit;
    }

    // Eingegebene PIN mit der PIN aus der .env vergleichen
    if ($userPin === $realPin) {
        // Erfolg: Session-ID regenerieren, um Session Hijacking zu verhindern
        session_regenerate_id(true);
        // Login in der Session vermerken
        $_SESSION['isAdmin'] = true;
        
        // Zähler zurücksetzen
        $_SESSION['login_attempts'] = 0;
        unset($_SESSION['lockout_until']);
        
        echo json_encode(['success' => true]);
    }
    else {
        // Fehler: PIN ist falsch
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        
        // Künstliche Verzögerung (1,5 Sekunden), um Brute-Force-Bots drastisch zu verlangsamen
        usleep(1500000);

        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['lockout_until'] = time() + 300; // 5 Minuten Sperre
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => 'Zu viele Fehlversuche. Der Login wurde für 5 Minuten gesperrt.']);
        } else {
            http_response_code(401);
            $attemptsLeft = 5 - $_SESSION['login_attempts'];
            echo json_encode(['success' => false, 'error' => "Falscher PIN. Noch $attemptsLeft Versuche vor der Sperrung."]);
        }
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
