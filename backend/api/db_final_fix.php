<?php
/**
 * DB FINAL FIX (db_final_fix.php)
 * Creates the archived_stats table on the server.
 */

require_once 'db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS archived_stats (
        id INT(11) NOT NULL AUTO_INCREMENT,
        station_id INT(11) NOT NULL,
        user_id INT(11) NOT NULL,
        archive_month TINYINT(4) NOT NULL,
        archive_year SMALLINT(6) NOT NULL,
        total_pings INT(11) NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE INDEX idx_station_user_date (station_id, user_id, archive_year, archive_month)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "<h1>Erfolg!</h1><p>Die Tabelle <b>archived_stats</b> wurde erfolgreich angelegt oder ist bereits vorhanden.</p>";

} catch (Exception $e) {
    echo "<h1>Fehler</h1><p>" . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
