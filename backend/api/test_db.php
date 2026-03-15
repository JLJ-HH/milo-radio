<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM stations");
    echo json_encode(['success' => true, 'count' => $stmt->fetchColumn()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
