<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);

try {
    $stmt = $pdo->prepare('SELECT id as db_id, CONCAT("PRX-", id) as id, title, description, category, priority, start_time as start, end_time as end, deadline as dueDate, status FROM tasks WHERE user_id = :user_id ORDER BY deadline ASC');
    $stmt->execute(['user_id' => $user['id']]);
    $tasks = $stmt->fetchAll();
    
    respond(200, 'success', $tasks);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch tasks');
}

