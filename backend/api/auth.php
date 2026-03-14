<?php
// backend/api/auth.php
session_start();
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, DELETE');

// Pfad zur .env im backend-Ordner
$envPath = __DIR__ . '/../.env';

if (file_exists($envPath)) {
    $env = parse_ini_file($envPath);
    $realPin = isset($env['ADMIN_PIN']) ? trim($env['ADMIN_PIN']) : null;
}
else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => '.env Datei nicht gefunden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => $_SESSION['isAdmin'] ?? false]);
    exit;
}

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

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Methode nicht erlaubt']);
?>
