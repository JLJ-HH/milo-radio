<?php
// backend/api/get_stations.php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("
        SELECT 
            id, 
            sender_name AS \"sender_Name\", 
            sender_url AS \"sender_Url\", 
            sender_logo AS \"sender_Logo\", 
            genre, 
            now_playing_url 
        FROM stations 
        ORDER BY sender_name ASC
    ");
    $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($stations as &$station) {
        $station['id'] = (int)$station['id'];
    }
    echo json_encode($stations);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage()]);
}
?>
