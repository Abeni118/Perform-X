<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);
$input = input_json();

$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$category = trim((string)($input['category'] ?? 'General'));
$priority = trim((string)($input['priority'] ?? 'Medium'));
$startTime = trim((string)($input['start'] ?? '09:00'));
$endTime = trim((string)($input['end'] ?? '10:00'));
$deadline = trim((string)($input['dueDate'] ?? ''));
$status = trim((string)($input['status'] ?? 'Pending'));

if ($title === '' || $deadline === '') {
    respond(400, 'error', null, 'Title and due date are required.');
}

// PRIORITY CONFLICT CHECK
$conflictAdjusted = null;
$messagePrefix = 'Task created';

$checkStmt = $pdo->prepare(
    'SELECT id FROM tasks 
     WHERE user_id = :user_id 
       AND deadline = :deadline 
       AND priority = :priority 
       AND status != \'Completed\'
       AND start_time < :end_time 
       AND end_time > :start_time
     LIMIT 1'
);
$checkStmt->execute([
    'user_id' => $user['id'],
    'deadline' => $deadline,
    'priority' => $priority,
    'start_time' => $startTime,
    'end_time' => $endTime
]);

if ($checkStmt->fetch()) {
    if ($priority === 'High') {
        $priority = 'Medium';
        $conflictAdjusted = 'Medium';
    } elseif ($priority === 'Medium' || $priority === 'Low') {
        $priority = 'Low';
        $conflictAdjusted = 'Low';
    }
    $messagePrefix = "Task created, but priority conflict detected. Adjusted to {$priority}";
}

$stmt = $pdo->prepare(
    'INSERT INTO tasks (user_id, title, description, category, priority, start_time, end_time, deadline, status) 
     VALUES (:user_id, :title, :description, :category, :priority, :start_time, :end_time, :deadline, :status)'
);
$stmt->execute([
    'user_id' => $user['id'],
    'title' => $title,
    'description' => $description,
    'category' => $category,
    'priority' => $priority,
    'start_time' => $startTime,
    'end_time' => $endTime,
    'deadline' => $deadline,
    'status' => $status
]);

$newId = (int)$pdo->lastInsertId();

$newTask = [
    'id' => "PRX-{$newId}",
    'db_id' => $newId,
    'title' => $title,
    'description' => $description,
    'category' => $category,
    'priority' => $priority,
    'start' => $startTime,
    'end' => $endTime,
    'dueDate' => $deadline,
    'status' => $status
];

if (isset($conflictAdjusted)) {
    $newTask['conflict_adjusted'] = $conflictAdjusted;
}

respond(201, 'success', $newTask, $messagePrefix);

