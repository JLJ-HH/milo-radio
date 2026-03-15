<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Starting debug...\n";
try {
    require_once __DIR__ . '/db.php';
    echo "db.php required successfully.\n";
    if (isset($pdo)) {
        echo "PDO object exists.\n";
        $stmt = $pdo->query("SELECT 1");
        echo "Query successful.\n";
    } else {
        echo "PDO object NOT found.\n";
    }
} catch (Throwable $t) {
    echo "Caught Throwable: " . $t->getMessage() . "\n";
    echo "File: " . $t->getFile() . " Line: " . $t->getLine() . "\n";
}
?>
