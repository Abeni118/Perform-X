<?php
declare(strict_types=1);

header('Content-Type: application/json');
ini_set('display_errors', '0');
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function respond(int $code, string $status, $data = null, ?string $message = null): void
{
    http_response_code($code);
    $payload = ['status' => $status];
    if ($message !== null) {
        $payload['message'] = $message;
    }
    if ($data !== null) {
        $payload['data'] = $data;
    }
    echo json_encode($payload);
    exit;
}

function input_json(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

