<?php
/**
 * ADMIN STATS API
 * 
 * Provides global analytics for the admin panel.
 * Protected by admin session.
 */

session_start();
header('Content-Type: application/json');

// Security Check: Only admins allowed
if (!isset($_SESSION['isAdmin']) || $_SESSION['isAdmin'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Nicht autorisiert']);
    exit;
}

require_once 'db.php';

try {
    $stats = [];

    // 1. Top 10 Stations (Based on listen_events)
    // We count how many times each station was "pinged" or "played"
    $stmtTop = $pdo->query("
        SELECT 
            s.sender_name, 
            COUNT(l.id) as listen_count
        FROM stations s
        LEFT JOIN listen_events l ON s.id = l.station_id
        GROUP BY s.id
        ORDER BY listen_count DESC
        LIMIT 10
    ");
    $stats['topStations'] = $stmtTop->fetchAll();

    // 2. Active Listeners (Live-Status inside the last 10 minutes)
    // We count unique users who sent a listen event in the last 10 minutes
    $stmtLive = $pdo->query("
        SELECT COUNT(DISTINCT user_id) as active_listeners
        FROM listen_events
        WHERE created_at > NOW() - INTERVAL 10 MINUTE
    ");
    $stats['liveStats'] = $stmtLive->fetch();

    // 3. Most Active User Sessions
    // List unique sessions and their event count in the last 24 hours
    $stmtUsers = $pdo->query("
        SELECT 
            u.session_token, 
            COUNT(l.id) as event_count,
            MAX(l.created_at) as last_activity
        FROM users u
        INNER JOIN listen_events l ON u.id = l.user_id
        WHERE l.created_at > NOW() - INTERVAL 24 HOUR
        GROUP BY u.id
        ORDER BY last_activity DESC
        LIMIT 20
    ");
    $stats['activeSessions'] = $stmtUsers->fetchAll();

    echo json_encode(['success' => true, 'data' => $stats]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Fehler beim Abrufen der Statistiken',
        'debug' => $e->getMessage()
    ]);
}
?>
