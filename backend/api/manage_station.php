<?php
/**
 * MANAGE STATIONS API (manage_station.php)
 * 
 * Abgesicherte CRUD-Schnittstelle zur Verwaltung von Radiosendern in der MySQL-Datenbank.
 * Erfordert eine aktive Admin-Session ($_SESSION['isAdmin'] === true).
 */

session_start();

header('Content-Type: application/json; charset=utf-8');

// 1. Authentifizierungs-Prüfung (Session oder robuster milo_admin_token Cookie)
$envPath = __DIR__ . '/../.env';
$realPin = null;
if (file_exists($envPath)) {
    $env = parse_ini_file($envPath);
    $realPin = isset($env['ADMIN_PIN']) ? trim($env['ADMIN_PIN']) : null;
}
$expectedToken = $realPin ? hash_hmac('sha256', 'milo_admin_auth', $realPin) : '';

$isAdmin = (isset($_SESSION['isAdmin']) && $_SESSION['isAdmin'] === true)
    || (!empty($expectedToken) && isset($_COOKIE['milo_admin_token']) && hash_equals($expectedToken, $_COOKIE['milo_admin_token']));

if (!$isAdmin) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Nicht autorisiert. Bitte im Admin-Bereich einloggen.'
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

// Hilfsfunktion zur Aktualisierung der Fallback-JSON-Datei
function syncJsonFile($pdo) {
    try {
        $jsonFile = __DIR__ . '/../../frontend/json/sender_daten.json';
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
        $allStations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($allStations as &$st) {
            $st['id'] = (int)$st['id'];
        }
        if (is_writable(dirname($jsonFile)) || is_writable($jsonFile)) {
            file_put_contents($jsonFile, json_encode($allStations, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }
    } catch (\Throwable $e) {
        // Stilles Logging, DB-Operation bleibt dennoch erfolgreich
        error_log("Warnung: sender_daten.json konnte nicht synchronisiert werden: " . $e->getMessage());
    }
}

// Eingabedaten lesen (JSON Body oder Form-Data)
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = $input['action'] ?? $_GET['action'] ?? '';

// Fallback über HTTP-Methode, falls 'action' nicht explizit gesetzt ist
if (empty($action)) {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST') {
        $action = isset($input['id']) && !empty($input['id']) ? 'update' : 'add';
    } elseif ($method === 'PUT') {
        $action = 'update';
    } elseif ($method === 'DELETE') {
        $action = 'delete';
    }
}

try {
    switch ($action) {
        case 'add':
        case 'create':
            $senderName = trim($input['sender_Name'] ?? $input['sender_name'] ?? '');
            $senderUrl = trim($input['sender_Url'] ?? $input['sender_url'] ?? '');
            $genre = trim($input['genre'] ?? 'Allgemein');
            $senderLogo = trim($input['sender_Logo'] ?? $input['sender_logo'] ?? '') ?: null;
            $nowPlayingUrl = trim($input['now_playing_url'] ?? $input['nowPlayingUrl'] ?? '') ?: null;

            if (empty($senderName) || empty($senderUrl)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Sender-Name und Stream-URL sind Pflichtfelder.'
                ]);
                exit;
            }

            $stmt = $pdo->prepare("
                INSERT INTO stations (sender_name, sender_url, genre, sender_logo, now_playing_url)
                VALUES (:sender_name, :sender_url, :genre, :sender_logo, :now_playing_url)
            ");
            $stmt->execute([
                ':sender_name' => $senderName,
                ':sender_url' => $senderUrl,
                ':genre' => $genre,
                ':sender_logo' => $senderLogo,
                ':now_playing_url' => $nowPlayingUrl
            ]);

            $newId = (int)$pdo->lastInsertId();

            $newStation = [
                'id' => $newId,
                'sender_Name' => $senderName,
                'sender_Url' => $senderUrl,
                'genre' => $genre,
                'sender_Logo' => $senderLogo,
                'now_playing_url' => $nowPlayingUrl
            ];

            syncJsonFile($pdo);

            echo json_encode([
                'success' => true,
                'message' => "Sender '{$senderName}' erfolgreich in der Datenbank gespeichert.",
                'station' => $newStation
            ]);
            break;

        case 'update':
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $senderName = trim($input['sender_Name'] ?? $input['sender_name'] ?? '');
            $senderUrl = trim($input['sender_Url'] ?? $input['sender_url'] ?? '');
            $genre = trim($input['genre'] ?? 'Allgemein');
            $senderLogo = trim($input['sender_Logo'] ?? $input['sender_logo'] ?? '') ?: null;
            $nowPlayingUrl = trim($input['now_playing_url'] ?? $input['nowPlayingUrl'] ?? '') ?: null;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Ungültige Sender-ID.'
                ]);
                exit;
            }

            if (empty($senderName) || empty($senderUrl)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Sender-Name und Stream-URL dürfen nicht leer sein.'
                ]);
                exit;
            }

            $stmt = $pdo->prepare("
                UPDATE stations 
                SET sender_name = :sender_name,
                    sender_url = :sender_url,
                    genre = :genre,
                    sender_logo = :sender_logo,
                    now_playing_url = :now_playing_url
                WHERE id = :id
            ");
            $stmt->execute([
                ':sender_name' => $senderName,
                ':sender_url' => $senderUrl,
                ':genre' => $genre,
                ':sender_logo' => $senderLogo,
                ':now_playing_url' => $nowPlayingUrl,
                ':id' => $id
            ]);

            $updatedStation = [
                'id' => $id,
                'sender_Name' => $senderName,
                'sender_Url' => $senderUrl,
                'genre' => $genre,
                'sender_Logo' => $senderLogo,
                'now_playing_url' => $nowPlayingUrl
            ];

            syncJsonFile($pdo);

            echo json_encode([
                'success' => true,
                'message' => "Sender '{$senderName}' erfolgreich aktualisiert.",
                'station' => $updatedStation
            ]);
            break;

        case 'delete':
            $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Ungültige Sender-ID zum Löschen.'
                ]);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM stations WHERE id = :id");
            $stmt->execute([':id' => $id]);

            syncJsonFile($pdo);

            echo json_encode([
                'success' => true,
                'message' => "Sender erfolgreich aus der Datenbank gelöscht.",
                'id' => $id
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => "Unbekannte Aktion '{$action}'. Erlaubt: add, update, delete."
            ]);
            break;
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Datenbankfehler: ' . $e->getMessage()
    ]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Serverfehler: ' . $e->getMessage()
    ]);
}
