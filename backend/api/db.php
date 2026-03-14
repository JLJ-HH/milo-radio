<?php
// backend/api/db.php
// Lade .env Datei aus dem backend-Ordner
$envPath = __DIR__ . '/../.env';

// Sicherere Methode zum Laden der Konfiguration (besonders auf shared hosting wie Strato)
$config = [];
if (file_exists($envPath)) {
    $config = parse_ini_file($envPath);
}

$host = $config['DB_HOST'] ?? 'localhost';
$port = $config['DB_PORT'] ?? '3306';
$db   = $config['DB_NAME'] ?? '';
$user = $config['DB_USER'] ?? '';
$pass = $config['DB_PASSWORD'] ?? '';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    if (empty($host) || empty($db) || empty($user)) {
        throw new Exception("Konfiguration unvollständig (Host/DB/User leer in .env)");
    }
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'debug' => [
            'message' => $e->getMessage(),
            'attempted_host' => $host,
            'attempted_db' => $db,
            'env_exists' => file_exists($envPath)
        ]
    ]);
    exit;
}
?>
