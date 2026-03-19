<?php
// backend/api/import_json_to_db.php
session_start();
if (!isset($_SESSION['isAdmin']) || $_SESSION['isAdmin'] !== true) {
    http_response_code(403);
    die("Unauthorized.");
}
require_once __DIR__ . '/db.php';

// Pfad angepasst: zeigt nun auf den neuen frontend/json Ordner
$jsonFile = __DIR__ . '/../../frontend/json/sender_daten.json';

if (!file_exists($jsonFile)) {
    die("Error: JSON file not found at " . $jsonFile . "\n");
}

$jsonData = file_get_contents($jsonFile);
$stations = json_decode($jsonData, true);

if ($stations === null) {
    die("Error: Invalid JSON data.\n");
}

$importedCount = 0;

try {
    // Optional: Tabelle leeren, um nur die echten Daten zu haben
    $pdo->exec("DELETE FROM stations WHERE genre IN ('Love', 'Party')"); 

    $stmt = $pdo->prepare("
        REPLACE INTO stations (id, sender_name, sender_url, sender_logo, genre, now_playing_url) 
        VALUES (:id, :name, :url, :logo, :genre, :now_playing_url)
    ");

    foreach ($stations as $station) {
        $stmt->bindValue(':id', $station['id']);
        $stmt->bindValue(':name', $station['sender_Name'] ?? $station['sender_name']);
        $stmt->bindValue(':url', $station['sender_Url'] ?? $station['sender_url']);
        $stmt->bindValue(':logo', $station['sender_Logo'] ?? $station['sender_logo'] ?? null);
        $stmt->bindValue(':genre', $station['genre'] ?? null);
        $stmt->bindValue(':now_playing_url', $station['now_playing_url'] ?? null);
        $stmt->execute();
        $importedCount++;
    }
    echo "Import completed successfully! Processed {$importedCount} stations.\n";

} catch (\Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    die("Import failed: " . $e->getMessage() . "\n");
}
?>
