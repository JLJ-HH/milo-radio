<?php
/**
 * Simple PHP Proxy to fetch ICY metadata from a shoutcast/icecast stream
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Disable error reporting output to avoid breaking JSON response
error_reporting(0);
ini_set('display_errors', 0);

if (!isset($_GET['stream']) || empty($_GET['stream'])) {
    echo json_encode(['error' => 'No stream URL provided', 'title' => '']);
    exit;
}

$streamUrl = urldecode($_GET['stream']);
$title = get_shoutcast_metadata($streamUrl);

if ($title) {
    echo json_encode(['title' => $title]);
} else {
    echo json_encode(['title' => '']);
}

/**
 * Connect to stream, send Icy-MetaData header, and extract title
 */
function get_shoutcast_metadata($url) {
    $parsed_url = parse_url($url);
    if (!$parsed_url || !isset($parsed_url['host'])) {
        return false;
    }
    
    $host = $parsed_url['host'];
    $scheme = isset($parsed_url['scheme']) ? $parsed_url['scheme'] : 'http';
    
    // Default ports
    $port = isset($parsed_url['port']) ? $parsed_url['port'] : ($scheme === 'https' ? 443 : 80);
    
    // Use SSL wrapper if https
    if ($scheme === 'https') {
        $host_prefix = 'ssl://';
    } else {
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
        return false; // Connection failed
    }

    // Set timeout to 3 seconds to avoid hanging
    stream_set_timeout($fp, 3);

    // Send HTTP request requesting ICY metadata
    $request = "GET $path HTTP/1.0\r\n";
    $request .= "Host: $host\r\n";
    $request .= "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) RadioApp/1.0\r\n";
    $request .= "Icy-MetaData: 1\r\n";
    $request .= "Connection: close\r\n\r\n";

    fwrite($fp, $request);

    // Read headers to find icy-metaint
    $icy_metaint = 0;
    while (!feof($fp)) {
        $header = fgets($fp, 512);
        if (trim($header) === '') {
            break; // End of headers
        }
        
        // Find meta interval
        if (stripos($header, 'icy-metaint:') !== false) {
            $icy_metaint = intval(trim(str_ireplace('icy-metaint:', '', $header)));
        }
    }

    // If stream doesn't support metadata, close and return nothing
    if ($icy_metaint === 0) {
        fclose($fp);
        return false;
    }

    // Read audio data until we hit the first metadata block
    $audio_data = '';
    $bytes_read = 0;
    $bytes_to_read = $icy_metaint;

    while (!feof($fp) && $bytes_read < $icy_metaint) {
        $chunk_size = min(4096, $bytes_to_read);
        $data = fread($fp, $chunk_size);
        if ($data === false || strlen($data) === 0) {
             break;
        }
        $bytes_read += strlen($data);
        $bytes_to_read -= strlen($data);
    }

    // Read the metadata length byte
    $meta_len_byte = fread($fp, 1);
    if ($meta_len_byte === false || strlen($meta_len_byte) === 0) {
         fclose($fp);
         return false;
    }

    // The length of the metadata is defined by (byte * 16)
    $meta_len = ord($meta_len_byte) * 16;
    
    if ($meta_len > 0) {
        // Read the actual metadata
        $metadata = fread($fp, $meta_len);
        fclose($fp);

        // Parse StreamTitle='My Song Title';
        if (preg_match("/StreamTitle='(.*?)';/", $metadata, $matches)) {
            // ISO-8859-1 conversion to avoid bad characters in JSON
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
