<?php
// backend/install_schema.php
require_once __DIR__ . '/api/db.php';

$sql = file_get_contents(__DIR__ . '/db_schema.sql');

try {
    $pdo->exec($sql);
    echo "Database schema installed successfully.\n";
} catch (\PDOException $e) {
    die("Error installing schema: " . $e->getMessage() . "\n");
}
?>
