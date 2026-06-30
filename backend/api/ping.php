<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$stationId = $input['station_id'] ?? null;
if (!$stationId || !is_numeric($stationId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid station_id.']);
    exit;
}

// 1. Session-Cookie Validierung (Spam-Schutz: Keine Pings ohne vorherige App-Initialisierung)
if (!isset($_COOKIE['milo_session_token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid session. Please reload the app.']);
    exit;
}

$sessionToken = $_COOKIE['milo_session_token'];

// 2. Rate-Limiting (Spam-Schutz: Pings dürfen max. alle 15 Sekunden gesendet werden)
$now = time();
if (isset($_SESSION['last_ping_time'])) {
    $elapsed = $now - $_SESSION['last_ping_time'];
    if ($elapsed < 15) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many requests. Please wait.']);
        exit;
    }
}
$_SESSION['last_ping_time'] = $now;

// Erst laden wir die Datenbank, wenn alle Checks bestanden wurden (Ressourcen-Schonung)
require_once __DIR__ . '/db.php';
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = :token");
    $stmt->execute([':token' => $sessionToken]);
    $userId = $stmt->fetchColumn();
    if (!$userId) {
        $stmt = $pdo->prepare("INSERT INTO users (session_token) VALUES (:token)");
        $stmt->execute([':token' => $sessionToken]);
        $userId = $pdo->lastInsertId();
    }
    $stmt = $pdo->prepare("INSERT INTO listen_events (user_id, station_id) VALUES (:user_id, :station_id)");
    $stmt->execute([
        ':user_id' => $userId,
        ':station_id' => $stationId
    ]);
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Ping recorded.', 'station_id' => $stationId]);
} catch (\Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
