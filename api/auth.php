<?php
// CSRF-Schutz und Sessions aktivieren
session_start();

// CORS-Header für lokale Entwicklung
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET');

// .env Datei laden
$envPath = __DIR__ . '/../../private/.env';
if (file_exists($envPath)) {
    $env = parse_ini_file($envPath);
    $realPin = $env['ADMIN_PIN'] ?? null;
}
else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => '.env Datei nicht gefunden']);
    exit;
}

// GET: Nur prüfen, ob Admin eingeloggt ist
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => $_SESSION['isAdmin'] ?? false]);
    exit;
}

// POST: PIN überprüfen und einloggen
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userPin = $input['pin'] ?? '';

    if ($userPin === $realPin) {
        $_SESSION['isAdmin'] = true;
        echo json_encode(['success' => true]);
    }
    else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Falscher PIN']);
    }
    exit;
}

// Logout
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
