<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

function require_auth(bool $requireAdmin = false): array
{
    if (!isset($_SESSION['user_id'], $_SESSION['role'], $_SESSION['email'])) {
        respond(401, 'error', null, 'Unauthorized');
    }

    if ($requireAdmin && $_SESSION['role'] !== 'admin') {
        respond(403, 'error', null, 'Forbidden: admin access required');
    }

    return [
        'id' => (int)$_SESSION['user_id'],
        'name' => (string)($_SESSION['user_name'] ?? ''),
        'role' => (string)$_SESSION['role'],
        'email' => (string)$_SESSION['email']
    ];
}

if (basename($_SERVER['SCRIPT_NAME']) === 'auth_check.php') {
    $needAdmin = isset($_GET['admin']) && $_GET['admin'] === '1';
    $user = require_auth($needAdmin);
    respond(200, 'success', $user, 'Authenticated');
}

