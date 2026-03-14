<?php
// backend/api/trends.php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
$type = $_GET['type'] ?? 'global';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$timeframe = $_GET['timeframe'] ?? 'all_time';
$sessionToken = $_COOKIE['milo_session_token'] ?? null;
$userId = null;
if ($type === 'personal') {
    if (!$sessionToken) {
        echo json_encode([]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = :token");
    $stmt->execute([':token' => $sessionToken]);
    $userId = $stmt->fetchColumn();
    if (!$userId) {
        echo json_encode([]);
        exit;
    }
}
$timeFilterSql = "";
if ($timeframe === 'today') {
    $timeFilterSql = " AND le.created_at >= current_date ";
} elseif ($timeframe === 'week') {
    $timeFilterSql = " AND le.created_at >= current_date - interval '7 days' ";
}
try {
    if ($type === 'personal') {
        $sql = "
            SELECT s.*, count(le.id) as listen_count
            FROM stations s
            JOIN listen_events le ON s.id = le.station_id
            WHERE le.user_id = :user_id {$timeFilterSql}
            GROUP BY s.id
            ORDER BY listen_count DESC
            LIMIT :limit
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    } else {
        $sql = "
            SELECT s.*, count(le.id) as listen_count
            FROM stations s
            JOIN listen_events le ON s.id = le.station_id
            WHERE 1=1 {$timeFilterSql}
            GROUP BY s.id
            ORDER BY listen_count DESC
            LIMIT :limit
        ";
        $stmt = $pdo->prepare($sql);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $trends = $stmt->fetchAll();
    echo json_encode($trends);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
