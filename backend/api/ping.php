<?php
// backend/api/ping.php
require_once __DIR__ . '/db.php';
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
if (!isset($_COOKIE['milo_session_token'])) {
    $sessionToken = bin2hex(random_bytes(32));
    setcookie('milo_session_token', $sessionToken, time() + (365 * 24 * 60 * 60), '/');
} else {
    $sessionToken = $_COOKIE['milo_session_token'];
}
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
