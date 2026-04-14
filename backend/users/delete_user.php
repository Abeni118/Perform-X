<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth_check.php';
require_once __DIR__ . '/../config/database.php';

require_auth(true);

$input = input_json();
$id = (int)($input['id'] ?? 0);
if ($id <= 0) {
    respond(400, 'error', null, 'Valid id is required.');
}

$stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
$stmt->execute(['id' => $id]);

if ($stmt->rowCount() === 0) {
    respond(404, 'error', null, 'User not found.');
}

respond(200, 'success', ['id' => $id], 'User deleted');

