<?php
/**
 * METADATA PROXY
 * 
 * Dieses Skript dient als Proxy, um ICY-Metadaten (Titel und Interpret) 
 * von einem Shoutcast- oder Icecast-Audiostream abzurufen.
 */

// ============================================================
// 1. HEADER UND INITIALISIERUNG
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Fehlermeldungen unterdrücken, damit sie das JSON-Format nicht zerstören
error_reporting(0);
ini_set('display_errors', 0);

// Prüfen, ob eine Stream-URL übergeben wurde
if (!isset($_GET['stream']) || empty($_GET['stream'])) {
    echo json_encode(['error' => 'Keine Stream-URL angegeben', 'title' => '']);
    exit;
}

// ============================================================
// 2. HAUPTLOGIK
// ============================================================

$streamUrl = urldecode($_GET['stream']);
$title = get_shoutcast_metadata($streamUrl);

// Ergebnis als JSON zurückgeben
if ($title) {
    echo json_encode(['title' => $title]);
}
else {
    echo json_encode(['title' => '']);
}

// ============================================================
// 3. HILFSFUNKTIONEN
// ============================================================

/**
 * Verbindet sich mit dem Stream, fordert Metadaten an und extrahiert den Titel.
 * 
 * @param string $url Die URL des Audiostreams
 * @return string|false Der gefundene Titel oder false bei Fehler
 */
function get_shoutcast_metadata($url)
{
    // URL analysieren (Host, Port, Pfad etc.)
    $parsed_url = parse_url($url);
    if (!$parsed_url || !isset($parsed_url['host'])) {
        return false;
    }

    $host = $parsed_url['host'];
    $scheme = isset($parsed_url['scheme']) ? $parsed_url['scheme'] : 'http';

    // Standard-Ports setzen (80 für HTTP, 443 für HTTPS)
    $port = isset($parsed_url['port']) ? $parsed_url['port'] : ($scheme === 'https' ? 443 : 80);

    // Protokoll-Präfix für die Socket-Verbindung festlegen
    if ($scheme === 'https') {
        $host_prefix = 'ssl://';
    }
    else {
        $host_prefix = 'tcp://';
    }

    $path = isset($parsed_url['path']) ? $parsed_url['path'] : '/';
    if (isset($parsed_url['query'])) {
        $path .= '?' . $parsed_url['query'];
    }

    // SSL-Kontext erstellen (Zertifikatsprüfung wird hier ignoriert für maximale Kompatibilität)
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    // Socket-Verbindung zum Server öffnen
    $fp = @stream_socket_client($host_prefix . $host . ':' . $port, $errno, $errstr, 3, STREAM_CLIENT_CONNECT, $context);

    if (!$fp) {
        return false; // Verbindung fehlgeschlagen
    }

    // Timeout auf 3 Sekunden setzen, damit das Skript nicht hängen bleibt
    stream_set_timeout($fp, 3);

    // HTTP-Anfrage senden und nach Metadaten fragen (Icy-MetaData: 1)
    $request = "GET $path HTTP/1.0\r\n";
    $request .= "Host: $host\r\n";
    $request .= "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioApp/1.0\r\n";
    $request .= "Icy-MetaData: 1\r\n";
    $request .= "Connection: close\r\n\r\n";

    fwrite($fp, $request);

    // Header auslesen, um 'icy-metaint' zu finden (Intervall der Metadaten im Stream)
    $icy_metaint = 0;
    while (!feof($fp)) {
        $header = fgets($fp, 512);
        if (trim($header) === '') {
            break; // Ende der Header erreicht
        }

        // Suchen nach dem Metadaten-Intervall
        if (stripos($header, 'icy-metaint:') !== false) {
            $icy_metaint = intval(trim(str_ireplace('icy-metaint:', '', $header)));
        }
    }

    // Wenn der Stream keine Metadaten unterstützt
    if ($icy_metaint === 0) {
        fclose($fp);
        return false;
    }

    // Audiodaten überspringen, bis der erste Metadaten-Block erreicht wird
    $bytes_read = 0;
    while (!feof($fp) && $bytes_read < $icy_metaint) {
        $chunk_size = min(4096, $icy_metaint - $bytes_read);
        $data = fread($fp, $chunk_size);
        if ($data === false || strlen($data) === 0) {
            break;
        }
        $bytes_read += strlen($data);
    }

    // Das Längen-Byte der Metadaten lesen
    $meta_len_byte = fread($fp, 1);
    if ($meta_len_byte === false || strlen($meta_len_byte) === 0) {
        fclose($fp);
        return false;
    }

    // Die tatsächliche Länge der Metadaten berechnen (Byte-Wert * 16)
    $meta_len = ord($meta_len_byte) * 16;

    if ($meta_len > 0) {
        // Die eigentlichen Metadaten auslesen
        $metadata = fread($fp, $meta_len);
        fclose($fp);

        // Regex-Suche nach dem Titel-Format: StreamTitle='Sänger - Liedname';
        if (preg_match("/StreamTitle='(.*?)';/", $metadata, $matches)) {
            $title = $matches[1];
            // Falls UTF-8 Kodierung fehlt, konvertieren, um Fehler im JSON zu vermeiden
            if (!mb_check_encoding($title, 'UTF-8')) {
                $title = utf8_encode($title);
            }
            return trim($title);
        }
    }

    fclose($fp);
    return false;
}
?>
