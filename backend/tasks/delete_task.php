<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$user = require_auth(false);
$input = input_json();

$idStr = (string)($input['id'] ?? '');
$dbId = (int)str_replace('PRX-', '', $idStr);

if ($dbId <= 0) {
    respond(400, 'error', null, 'Valid id is required.');
}

$stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id AND user_id = :user_id');
$stmt->execute(['id' => $dbId, 'user_id' => $user['id']]);

if ($stmt->rowCount() === 0) {
    respond(404, 'error', null, 'Task not found or access denied.');
}

respond(200, 'success', ['id' => $idStr], 'Task deleted');

