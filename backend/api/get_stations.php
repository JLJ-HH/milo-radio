<?php
session_start();

// Session-Token (milo_session_token) initialisieren, falls noch nicht vorhanden.
// Dadurch wird der Cookie gesetzt, sobald der Benutzer die App lädt.
if (!isset($_COOKIE['milo_session_token'])) {
    $sessionToken = bin2hex(random_bytes(32));
    setcookie('milo_session_token', $sessionToken, [
        'expires' => time() + (365 * 24 * 60 * 60),
        'path' => '/',
        'secure' => true, // Nur über HTTPS
        'httponly' => true, // Nicht via JS lesbar
        'samesite' => 'Lax' // Schutz vor CSRF
    ]);
}

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
