<?php
/**
 * BACKEND RADIO STATION SEARCH API (radio_search.php)
 * 
 * Durchsucht das weltweite Radio-Browser Verzeichnis nach Sendernamen:
 * - Liefert Name, Audio-Stream-URL, Senderlogo (Favicon), Genre und Bitrate
 * - Dient dem automatischen Ausfüllen im Admin-Bereich
 * - 10-Minuten Server-Cache zur Minimierung externer Latenzen
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$query = trim($_GET['q'] ?? '');
$limit = isset($_GET['limit']) ? max(1, min(25, (int)$_GET['limit'])) : 12;

if (mb_strlen($query, 'UTF-8') < 2) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Suchbegriff muss mindestens 2 Zeichen lang sein.',
        'stations' => []
    ]);
    exit;
}

// Caching: 10 Minuten im Temp-Verzeichnis
$cacheKey = 'milo_radio_search_' . md5(mb_strtolower($query, 'UTF-8') . '_' . $limit);
$cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $cacheKey . '.json';
$cacheDuration = 600;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
    $cached = file_get_contents($cacheFile);
    if ($cached) {
        echo $cached;
        exit;
    }
}

// Radio-Browser API Server (mit Fallback)
$servers = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info'
];

$rawJson = false;
$queryParams = http_build_query([
    'name' => $query,
    'limit' => $limit,
    'hidebroken' => 'true',
    'order' => 'clickcount',
    'reverse' => 'true'
]);

$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: MiloRadio/2.0 (Station Search Bot)\r\nAccept: application/json\r\n",
        'timeout' => 5
    ]
];
$context = stream_context_create($opts);

foreach ($servers as $base) {
    $apiUrl = $base . '/json/stations/search?' . $queryParams;
    $res = @file_get_contents($apiUrl, false, $context);
    if ($res !== false) {
        $rawJson = $res;
        break;
    }
}

if ($rawJson === false) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'Verbindung zur Radio-Browser Datenbank fehlgeschlagen.',
        'stations' => []
    ]);
    exit;
}

$decoded = json_decode($rawJson, true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'Ungültige Antwort von Radio-Browser.',
        'stations' => []
    ]);
    exit;
}

$stations = [];
foreach ($decoded as $item) {
    $name = trim($item['name'] ?? '');
    $streamUrl = trim($item['url_resolved'] ?: ($item['url'] ?? ''));
    if (!$name || !$streamUrl) continue;

    // Genre aus Tags aufbereiten (erstes Tag großgeschrieben oder mehrere)
    $rawTags = trim($item['tags'] ?? '');
    $genre = 'Radio';
    if ($rawTags) {
        $tagsList = array_filter(array_map('trim', explode(',', $rawTags)));
        if (!empty($tagsList)) {
            // Erstes sauberes Genre wählen und schön formatieren
            $firstGenre = ucwords(strtolower(reset($tagsList)));
            if (mb_strlen($firstGenre, 'UTF-8') <= 25) {
                $genre = $firstGenre;
            }
        }
    }

    $stations[] = [
        'id' => $item['stationuuid'] ?? '',
        'name' => $name,
        'stream_url' => $streamUrl,
        'logo' => trim($item['favicon'] ?? ''),
        'genre' => $genre,
        'tags' => $rawTags,
        'bitrate' => (int)($item['bitrate'] ?? 0),
        'codec' => strtoupper(trim($item['codec'] ?? '')),
        'country' => trim($item['country'] ?? ''),
        'homepage' => trim($item['homepage'] ?? '')
    ];
}

$responsePayload = json_encode([
    'success' => true,
    'query' => $query,
    'count' => count($stations),
    'stations' => $stations
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

// Im Cache ablegen
@file_put_contents($cacheFile, $responsePayload);

echo $responsePayload;
