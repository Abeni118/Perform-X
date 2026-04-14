<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

require_auth(true);

try {
    $stmt = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC');
    $users = $stmt->fetchAll();
    
    respond(200, 'success', $users);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch users');
}

