<?php
/**
 * BACKEND PODCAST RSS RESOLVER & EPISODES API (podcast.php)
 * 
 * Verarbeitet Podcast-RSS-Feeds für Milo-Radio:
 * - action=info: Liefert Metadaten für Admin Auto-Fill (Titel, Beschreibung, Logo, Genre, neueste Folge)
 * - action=episodes: Liefert die letzten N Episoden inklusive Audio-Stream-URL und Laufzeit
 * 
 * Beinhaltet einen Server-Cache (15 Minuten), um externe Server zu schonen und Latenz zu minimieren.
 */

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? 'episodes';

// --- ACTION: SEARCH PODCAST DIRECTORY ---
if ($action === 'search') {
    $term = trim($_GET['term'] ?? $_GET['q'] ?? '');
    if (mb_strlen($term, 'UTF-8') < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Bitte mindestens 2 Zeichen für die Suche eingeben.']);
        exit;
    }

    $searchLimit = isset($_GET['limit']) ? max(1, min(25, (int)$_GET['limit'])) : 12;
    $cacheKey = 'milo_podsearch_' . md5(mb_strtolower($term, 'UTF-8') . '_' . $searchLimit);
    $cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $cacheKey . '.json';
    $cacheDuration = 3600; // 1 Stunde Cache

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
        $cached = file_get_contents($cacheFile);
        if ($cached) {
            echo $cached;
            exit;
        }
    }

    $searchApiUrl = 'https://itunes.apple.com/search?term=' . urlencode($term) . '&entity=podcast&limit=' . $searchLimit;
    $res = fetchFeedXml($searchApiUrl);

    if ($res['http_code'] !== 200 || empty($res['content'])) {
        http_response_code(502);
        echo json_encode([
            'success' => false, 
            'error' => 'Podcast-Verzeichnis konnte nicht erreicht werden. Bitte prüfe deine Internetverbindung.'
        ]);
        exit;
    }

    $raw = json_decode($res['content'], true);
    $results = [];

    if (!empty($raw['results']) && is_array($raw['results'])) {
        foreach ($raw['results'] as $item) {
            $feedUrl = trim($item['feedUrl'] ?? '');
            if (empty($feedUrl)) {
                continue;
            }
            $results[] = [
                'title' => trim($item['collectionName'] ?? $item['trackName'] ?? 'Unbekannter Podcast'),
                'artist' => trim($item['artistName'] ?? ''),
                'feed_url' => $feedUrl,
                'logo' => $item['artworkUrl600'] ?? $item['artworkUrl100'] ?? '',
                'genre' => $item['primaryGenreName'] ?? 'Podcast',
                'track_count' => (int)($item['trackCount'] ?? 0)
            ];
        }
    }

    $outJson = json_encode([
        'success' => true,
        'term' => $term,
        'total' => count($results),
        'results' => $results
    ]);

    @file_put_contents($cacheFile, $outJson);
    echo $outJson;
    exit;
}

$url = trim($_GET['url'] ?? '');
$limit = isset($_GET['limit']) ? max(1, min(20, (int)$_GET['limit'])) : 5;

if (empty($url)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Keine Podcast-URL angegeben.']);
    exit;
}

// Falls jemand eine Podigee-Webseiten-URL eingibt (z.B. https://kiupdate.podigee.io/),
// können wir automatisch den Standard-Feed anhängen, falls die URL nicht schon mit .xml oder /feed endet.
if (strpos($url, 'podigee.io') !== false && strpos($url, '/feed') === false && substr($url, -4) !== '.xml') {
    $url = rtrim($url, '/') . '/feed/mp3';
}

// Caching: 15 Minuten Cache im Temp-Verzeichnis
$cacheKey = 'milo_podcast_' . md5($url);
$cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $cacheKey . '.json';
$cacheDuration = 900; // 15 Minuten

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
    $cachedData = json_decode(file_get_contents($cacheFile), true);
    if ($cachedData) {
        outputResult($action, $cachedData, $limit);
        exit;
    }
}

// XML-Feed per cURL (mit Fallback) abrufen
$fetchResult = fetchFeedXml($url);
$xmlString = $fetchResult['content'];
$httpCode = $fetchResult['http_code'];
$curlError = $fetchResult['error'];

if ($httpCode === 404) {
    http_response_code(404);
    echo json_encode([
        'success' => false, 
        'error' => 'Die Podcast-Feed-URL wurde nicht gefunden (HTTP 404). Bitte prüfe die Adresse.'
    ]);
    exit;
}

if ($httpCode === 403) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'error' => 'Der Zugriff auf den Podcast-Feed wurde verweigert (HTTP 403). Der Host blockiert externe Abrufe.'
    ]);
    exit;
}

if (empty($xmlString) || $httpCode >= 400) {
    http_response_code($httpCode >= 400 ? $httpCode : 502);
    $detail = !empty($curlError) ? $curlError : ($httpCode > 0 ? "HTTP $httpCode" : "Verbindungsfehler");
    echo json_encode([
        'success' => false, 
        'error' => "Podcast-Feed konnte nicht geladen werden ($detail). Bitte URL prüfen."
    ]);
    exit;
}

// XML parsen
libxml_use_internal_errors(true);
$xml = simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);

if (!$xml || !isset($xml->channel)) {
    http_response_code(422);
    echo json_encode([
        'success' => false, 
        'error' => 'Ungültiges RSS/Podcast-XML-Format oder Antwort war kein Feed.'
    ]);
    exit;
}

$channel = $xml->channel;
$namespaces = $xml->getNamespaces(true);
$itunes = isset($namespaces['itunes']) ? $channel->children($namespaces['itunes']) : null;

// Channel-Informationen extrahieren
$channelTitle = trim((string)$channel->title);
$channelDesc = trim((string)$channel->description);
$channelLink = trim((string)$channel->link);

// Logo finden (itunes:image oder channel->image->url)
$channelLogo = '';
if ($itunes && isset($itunes->image)) {
    $attrs = $itunes->image->attributes();
    if (isset($attrs['href'])) {
        $channelLogo = (string)$attrs['href'];
    }
}
if (empty($channelLogo) && isset($channel->image->url)) {
    $channelLogo = trim((string)$channel->image->url);
}

// Episoden extrahieren
$episodes = [];
if (isset($channel->item)) {
    foreach ($channel->item as $item) {
        $itemItunes = isset($namespaces['itunes']) ? $item->children($namespaces['itunes']) : null;
        
        // Audio Enclosure (Stream URL)
        $audioUrl = '';
        $audioLength = 0;
        if (isset($item->enclosure)) {
            $encAttrs = $item->enclosure->attributes();
            if (isset($encAttrs['url'])) {
                $audioUrl = (string)$encAttrs['url'];
            }
            if (isset($encAttrs['length'])) {
                $audioLength = (int)$encAttrs['length'];
            }
        }

        // Überspringen, falls keine Audio-URL existiert
        if (empty($audioUrl)) {
            continue;
        }

        // Dauer
        $durationRaw = '';
        if ($itemItunes && isset($itemItunes->duration)) {
            $durationRaw = trim((string)$itemItunes->duration);
        }

        // Formatieren der Dauer (Sekunden zu MM:SS oder HH:MM:SS)
        $durationFormatted = formatDuration($durationRaw);

        // Datum formatieren
        $pubDate = '';
        if (isset($item->pubDate)) {
            $ts = strtotime((string)$item->pubDate);
            if ($ts) {
                $pubDate = date('d.m.Y', $ts);
            }
        }

        $episodes[] = [
            'title' => trim((string)$item->title),
            'audio_url' => $audioUrl,
            'duration' => $durationFormatted,
            'pub_date' => $pubDate,
            'description' => mb_substr(strip_tags(trim((string)$item->description)), 0, 200, 'UTF-8')
        ];
    }
}

$parsedData = [
    'title' => $channelTitle,
    'description' => mb_substr(strip_tags($channelDesc), 0, 300, 'UTF-8'),
    'logo' => $channelLogo,
    'link' => $channelLink,
    'genre' => 'Podcast',
    'feed_url' => $url,
    'total_episodes' => count($episodes),
    'episodes' => $episodes
];

// Im Cache ablegen
@file_put_contents($cacheFile, json_encode($parsedData));

outputResult($action, $parsedData, $limit);

/**
 * Antwortausgabe abhängig von der angeforderten Action
 */
function outputResult($action, $data, $limit) {
    if ($action === 'info') {
        $latest = !empty($data['episodes']) ? $data['episodes'][0] : null;
        echo json_encode([
            'success' => true,
            'title' => $data['title'],
            'logo' => $data['logo'],
            'genre' => 'Podcast',
            'feed_url' => $data['feed_url'],
            'description' => $data['description'],
            'latest_episode' => $latest
        ]);
    } else {
        // action === 'episodes'
        $episodesSlice = array_slice($data['episodes'], 0, $limit);
        echo json_encode([
            'success' => true,
            'title' => $data['title'],
            'logo' => $data['logo'],
            'genre' => 'Podcast',
            'feed_url' => $data['feed_url'],
            'episodes' => $episodesSlice
        ]);
    }
}

/**
 * Formatiert Sekunden oder Zeitstrings in MM:SS bzw. HH:MM:SS
 */
function formatDuration($duration) {
    if (empty($duration)) return '';
    if (strpos($duration, ':') !== false) {
        return $duration;
    }
    $sec = (int)$duration;
    if ($sec <= 0) return '';
    $h = floor($sec / 3600);
    $m = floor(($sec % 3600) / 60);
    $s = $sec % 60;
    if ($h > 0) {
        return sprintf('%02d:%02d:%02d', $h, $m, $s);
    }
    return sprintf('%02d:%02d', $m, $s);
}

/**
 * Ruft die XML-Daten eines Podcast-Feeds robust per cURL (oder Fallback) ab
 */
function fetchFeedXml($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MiloRadio/2.0',
            CURLOPT_HTTPHEADER => [
                'Accept: application/rss+xml, application/xml, text/xml, */*'
            ],
            CURLOPT_ENCODING => '', // Automatische Dekomprimierung (gzip, deflate)
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        return [
            'content' => $response,
            'http_code' => (int)$httpCode,
            'error' => $curlError
        ];
    } else {
        // Fallback: stream_context_create mit Browser-Header und Redirects
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MiloRadio/2.0\r\nAccept: application/rss+xml, application/xml, text/xml, */*\r\n",
                'timeout' => 12,
                'follow_location' => 1,
                'max_redirects' => 5
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];
        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
        $httpCode = 200;
        if (isset($http_response_header) && !empty($http_response_header)) {
            preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $match);
            if (!empty($match[1])) {
                $httpCode = (int)$match[1];
            }
        }
        return [
            'content' => $response,
            'http_code' => $httpCode,
            'error' => $response === false ? 'Netzwerkverbindung fehlgeschlagen' : null
        ];
    }
}



