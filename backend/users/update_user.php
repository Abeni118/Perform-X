<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth_check.php';
require_once __DIR__ . '/../config/database.php';

require_auth(true);

$input = input_json();
$id = (int)($input['id'] ?? 0);
$name = trim((string)($input['name'] ?? ''));
$role = isset($input['role']) ? ((string)$input['role'] === 'admin' ? 'admin' : 'user') : null;

if ($id <= 0 || $name === '') {
    respond(400, 'error', null, 'Valid id and name are required.');
}

if ($role !== null) {
    $stmt = $pdo->prepare('UPDATE users SET name = :name, role = :role WHERE id = :id');
    $stmt->execute(['name' => $name, 'role' => $role, 'id' => $id]);
} else {
    $stmt = $pdo->prepare('UPDATE users SET name = :name WHERE id = :id');
    $stmt->execute(['name' => $name, 'id' => $id]);
}

if ($stmt->rowCount() === 0) {
    respond(404, 'error', null, 'User not found or unchanged.');
}

respond(200, 'success', ['id' => $id], 'User updated');

