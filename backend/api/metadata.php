<?php
// backend/api/metadata.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
error_reporting(0);
ini_set('display_errors', 0);
if (!isset($_GET['stream']) || empty($_GET['stream'])) {
    echo json_encode(['error' => 'Keine Stream-URL angegeben', 'title' => '']);
    exit;
}
$streamUrl = urldecode($_GET['stream']);

// SSRF PROTECTION
$host = parse_url($streamUrl, PHP_URL_HOST);
if (!$host) {
    echo json_encode(['error' => 'Ungültige URL', 'title' => '']);
    exit;
}

// Block localhost, private IPs, and file:// (implicit by parse_url/stream_socket_client)
$blocked = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
if (in_array(strtolower($host), $blocked) || preg_match('/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./', $host)) {
    echo json_encode(['error' => 'Zugriff auf interne Ressourcen verweigert', 'title' => '']);
    exit;
}

$title = get_shoutcast_metadata($streamUrl);
if ($title) {
    echo json_encode(['title' => $title]);
}
else {
    echo json_encode(['title' => '']);
}
function get_shoutcast_metadata($url)
{
    $parsed_url = parse_url($url);
    if (!$parsed_url || !isset($parsed_url['host'])) {
        return false;
    }
    $host = $parsed_url['host'];
    $scheme = isset($parsed_url['scheme']) ? $parsed_url['scheme'] : 'http';
    $port = isset($parsed_url['port']) ? $parsed_url['port'] : ($scheme === 'https' ? 443 : 80);
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
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);
    $fp = @stream_socket_client($host_prefix . $host . ':' . $port, $errno, $errstr, 3, STREAM_CLIENT_CONNECT, $context);
    if (!$fp) {
        return false; 
    }
    stream_set_timeout($fp, 3);
    $request = "GET $path HTTP/1.0\r\n";
    $request .= "Host: $host\r\n";
    $request .= "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioApp/1.0\r\n";
    $request .= "Icy-MetaData: 1\r\n";
    $request .= "Connection: close\r\n\r\n";
    fwrite($fp, $request);
    $icy_metaint = 0;
    while (!feof($fp)) {
        $header = fgets($fp, 512);
        if (trim($header) === '') {
            break; 
        }
        if (stripos($header, 'icy-metaint:') !== false) {
            $icy_metaint = intval(trim(str_ireplace('icy-metaint:', '', $header)));
        }
    }
    if ($icy_metaint === 0) {
        fclose($fp);
        return false;
    }
    $bytes_read = 0;
    while (!feof($fp) && $bytes_read < $icy_metaint) {
        $chunk_size = min(4096, $icy_metaint - $bytes_read);
        $data = fread($fp, $chunk_size);
        if ($data === false || strlen($data) === 0) {
            break;
        }
        $bytes_read += strlen($data);
    }
    $meta_len_byte = fread($fp, 1);
    if ($meta_len_byte === false || strlen($meta_len_byte) === 0) {
        fclose($fp);
        return false;
    }
    $meta_len = ord($meta_len_byte) * 16;
    if ($meta_len > 0) {
        $metadata = fread($fp, $meta_len);
        fclose($fp);
        if (preg_match("/StreamTitle='(.*?)';/", $metadata, $matches)) {
            $title = $matches[1];
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
