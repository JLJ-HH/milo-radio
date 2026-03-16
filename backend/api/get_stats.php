<?php
// backend/api/get_stats.php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

$period = $_GET['period'] ?? 'today';
$sessionToken = $_COOKIE['milo_session_token'] ?? null;

if (!$sessionToken) {
    echo json_encode(['error' => 'No session found']);
    exit;
}

try {
    // 1. Get User ID
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE session_token = :token");
    $stmtUser->execute([':token' => $sessionToken]);
    $userId = $stmtUser->fetchColumn();

    if (!$userId) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // 2. Define Date Filter
    $dateFilter = "CURRENT_DATE";
    $groupBy = "";
    $historyQuery = "";

    if ($period === 'week') {
        $dateFilter = "DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)";
        // Aggregation per weekday (MySQL)
        $historyQuery = "
            SELECT DAYNAME(created_at) as label, COUNT(id) as pings, DAYOFWEEK(created_at) as sort_idx
            FROM listen_events
            WHERE user_id = :user_id AND created_at >= $dateFilter
            GROUP BY label, sort_idx
            ORDER BY sort_idx
        ";
    } elseif ($period === 'month') {
        $dateFilter = "DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)";
        // Aggregation per day
        $historyQuery = "
            SELECT DATE(created_at) as label, COUNT(id) as pings
            FROM listen_events
            WHERE user_id = :user_id AND created_at >= $dateFilter
            GROUP BY label
            ORDER BY label
        ";
    } else {
        // Today
        $historyQuery = "
            SELECT HOUR(created_at) as label, COUNT(id) as pings
            FROM listen_events
            WHERE user_id = :user_id AND created_at >= $dateFilter
            GROUP BY label
            ORDER BY label
        ";
    }

    // 3. Top 5 Stations
    $stmtTop = $pdo->prepare("
        SELECT 
            s.sender_name, 
            s.genre,
            COUNT(e.id) as ping_count
        FROM stations s
        JOIN listen_events e ON s.id = e.station_id
        WHERE e.user_id = :user_id AND e.created_at >= $dateFilter
        GROUP BY s.id, s.sender_name, s.genre
        ORDER BY ping_count DESC
        LIMIT 5
    ");
    $stmtTop->execute([':user_id' => $userId]);
    $topStations = $stmtTop->fetchAll();

    // 4. History (Listening time over time)
    $stmtHistory = $pdo->prepare($historyQuery);
    $stmtHistory->execute([':user_id' => $userId]);
    $historyData = $stmtHistory->fetchAll();

    // 5. Genre Distribution
    $stmtGenres = $pdo->prepare("
        SELECT 
            s.genre, 
            COUNT(e.id) as ping_count
        FROM stations s
        JOIN listen_events e ON s.id = e.station_id
        WHERE e.user_id = :user_id AND e.created_at >= $dateFilter
        GROUP BY s.genre
        ORDER BY ping_count DESC
    ");
    $stmtGenres->execute([':user_id' => $userId]);
    $genreData = $stmtGenres->fetchAll();

    // 6. Summary Stats
    $stmtTotal = $pdo->prepare("
        SELECT COUNT(id) as total_pings
        FROM listen_events
        WHERE user_id = :user_id AND created_at >= $dateFilter
    ");
    $stmtTotal->execute([':user_id' => $userId]);
    $totalMinutes = round(($stmtTotal->fetchColumn() * 30) / 60, 1);

    $stmtLast = $pdo->prepare("
        SELECT s.sender_name, s.sender_logo, e.created_at
        FROM stations s
        JOIN listen_events e ON s.id = e.station_id
        WHERE e.user_id = :user_id
        ORDER BY e.created_at DESC
        LIMIT 1
    ");
    $stmtLast->execute([':user_id' => $userId]);
    $lastStation = $stmtLast->fetch();

    echo json_encode([
        'period' => $period,
        'summary' => [
            'total_minutes' => $totalMinutes,
            'last_active' => $lastStation
        ],
        'top_stations' => $topStations,
        'history' => $historyData,
        'genres' => $genreData
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage()]);
}
?>
