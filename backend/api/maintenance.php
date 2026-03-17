<?php
/**
 * MAINTENANCE API (maintenance.php)
 * 
 * Archives old data and optimizes the database.
 * Protected by CRON_TOKEN.
 */

require_once 'db.php';

header('Content-Type: application/json');

// 1. Check CRON_TOKEN (from .env)
$expectedToken = $config['CRON_TOKEN'] ?? '';
$providedToken = $_GET['token'] ?? $_POST['token'] ?? $_SERVER['HTTP_X_CRON_TOKEN'] ?? '';

if (empty($expectedToken) || $providedToken !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Nicht autorisiert. Ungültiger Token.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 2. Select data to be archived
    $selectSql = "
        SELECT 
            MONTH(created_at) as archive_month,
            YEAR(created_at) as archive_year,
            user_id,
            station_id,
            COUNT(*) as total_pings
        FROM listen_events
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY archive_month, archive_year, user_id, station_id
    ";
    $stmt = $pdo->query($selectSql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor(); // Free connection for next queries

    if (!empty($rows)) {
        // 3. Insert/Update archived_stats
        $insertSql = "
            INSERT INTO archived_stats (archive_month, archive_year, user_id, station_id, total_pings)
            VALUES (:archive_month, :archive_year, :user_id, :station_id, :total_pings)
            ON DUPLICATE KEY UPDATE total_pings = archived_stats.total_pings + VALUES(total_pings)
        ";
        $insertStmt = $pdo->prepare($insertSql);
        foreach ($rows as $row) {
            $insertStmt->execute($row);
        }
    }

    // 4. Delete archived data from original table
    $deleteSql = "
        DELETE FROM listen_events
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
    ";
    $pdo->exec($deleteSql);

    $pdo->commit();

    // 4. Optimize Tables (After transaction)
    $pdo->exec("OPTIMIZE TABLE listen_events");
    $pdo->exec("OPTIMIZE TABLE archived_stats");

    echo json_encode(['success' => true, 'message' => 'Wartung erfolgreich abgeschlossen.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'SQL-Fehler: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
