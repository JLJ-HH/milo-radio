<?php
// backend/api/get_stats.php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
try {
    $stmtTop = $pdo->query("
        SELECT 
            s.sender_name, 
            COUNT(e.id) as ping_count
        FROM stations s
        JOIN listen_events e ON s.id = e.station_id
        GROUP BY s.id, s.sender_name
        ORDER BY ping_count DESC
        LIMIT 5
    ");
    $topStations = $stmtTop->fetchAll();
    $stmtTime = $pdo->query("
        SELECT 
            COUNT(id) as total_pings
        FROM listen_events
        WHERE created_at >= CURRENT_DATE
    ");
    $timeData = $stmtTime->fetch();
    $totalMinutes = round(($timeData['total_pings'] * 30) / 60, 1);
    $stmtLast = $pdo->query("
        SELECT 
            s.sender_name,
            s.sender_logo,
            e.created_at
        FROM stations s
        JOIN listen_events e ON s.id = e.station_id
        ORDER BY e.created_at DESC
        LIMIT 1
    ");
    $lastStation = $stmtLast->fetch();
    echo json_encode([
        'top_stations' => $topStations,
        'total_minutes_today' => $totalMinutes,
        'last_active' => $lastStation
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage()]);
}
?>
