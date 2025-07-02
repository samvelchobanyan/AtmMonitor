<?php
// === Simple Secure PHP Proxy ===
// For development/testing use only — improve for production

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get target URL
$target_url = $_GET['url'] ?? '';
if (empty($target_url)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing `url` parameter']);
    exit();
}

// Basic validation
if (!filter_var($target_url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL format']);
    exit();
}

// ✅ Allowlist — secure usage
$parsed = parse_url($target_url);
$allowed_hosts = ['api.example.com', '37.186.122.133']; // 👈 update as needed

if (!in_array($parsed['host'], $allowed_hosts)) {
    http_response_code(403);
    echo json_encode(['error' => 'Target host not allowed']);
    exit();
}

// 🆕 ADD THIS: Handle additional query parameters
$params = $_GET;
unset($params['url']);
if (!empty($params)) {
    $query_string = http_build_query($params);
    $separator = (strpos($target_url, '?') !== false) ? '&' : '?';
    $target_url .= $separator . $query_string;
}

// Method and payload
$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');

// Initialize cURL
$ch = curl_init($target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // dev only

// Set method and body
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($input) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }
}

// Forward headers except Host
$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
$headers[] = 'User-Agent: PHP-Proxy/1.0';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(['error' => curl_error($ch)]);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Return response
http_response_code($http_code);
if ($content_type) {
    header("Content-Type: $content_type");
}
echo $response;
?>