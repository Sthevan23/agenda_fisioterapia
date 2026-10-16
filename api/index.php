<?php

declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Arquivo config.php não encontrado. Copie config.example.php para config.php',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once $configFile;
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/routes/patients.php';
require_once __DIR__ . '/routes/appointments.php';

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'https://fisio.sthevandev.com.br',
    'https://sthevandev.com.br',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$uriPath = preg_replace('#/+#', '/', $uriPath);

if (str_contains($uriPath, '/api/index.php')) {
    $uriPath = str_replace('/api/index.php', '/api', $uriPath);
}

$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
if ($basePath !== '' && str_starts_with($uriPath, $basePath)) {
    $uriPath = substr($uriPath, strlen($basePath));
}

$uriPath = trim($uriPath, '/');
$segments = $uriPath === '' ? [] : explode('/', $uriPath);

if (($segments[0] ?? '') === 'api') {
    array_shift($segments);
}

if (isset($_GET['route'])) {
    $segments = array_values(array_filter(explode('/', trim((string) $_GET['route'], '/'))));
}

$resource = $segments[0] ?? '';
$id = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;
$method = $_SERVER['REQUEST_METHOD'];
$body = readJsonBody();

try {
    $pdo = getDB();

    if ($resource === '' || $resource === 'health') {
        $pdo->query('SELECT 1');
        jsonResponse([
            'success' => true,
            'message' => 'FisioAgenda API online',
            'version' => '1.0.0',
            'database' => DB_NAME,
            'connected' => true,
        ]);
    }

    if ($resource === 'patients') {
        handlePatients($pdo, $method, $id, $body);
    }

    if ($resource === 'appointments') {
        handleAppointments($pdo, $method, $id, $body);
    }

    jsonError('Rota não encontrada', 404);
} catch (PDOException $e) {
    jsonError('Erro de banco de dados: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    jsonError('Erro interno: ' . $e->getMessage(), 500);
}
