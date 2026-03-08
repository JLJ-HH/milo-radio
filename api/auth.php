<?php
// CSRF-Schutz und Sessions aktivieren
session_start();

// CORS-Header für lokale Entwicklung
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET');

// .env Datei laden (Sucht an verschiedenen Orten für Local/Server)
$possiblePaths = [
    __DIR__ . '/../../privat/.env', // Strato Pfad
    __DIR__ . '/../.env', // Local XAMPP Pfad
    __DIR__ . '/../../private/.env' // Fallback / Alter Pfad
];

$envPath = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $envPath = $path;
        break;
    }
}

if ($envPath) {
    $env = parse_ini_file($envPath);
    $realPin = isset($env['ADMIN_PIN']) ? trim($env['ADMIN_PIN']) : null;
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
