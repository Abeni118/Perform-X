<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$user = require_auth(false);
$input = input_json();

$idStr = (string)($input['id'] ?? '');
$dbId = (int)str_replace('PRX-', '', $idStr);

$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$category = trim((string)($input['category'] ?? 'General'));
$priority = trim((string)($input['priority'] ?? 'Medium'));
$startTime = trim((string)($input['start'] ?? '09:00'));
$endTime = trim((string)($input['end'] ?? '10:00'));
$deadline = trim((string)($input['dueDate'] ?? ''));
$status = trim((string)($input['status'] ?? 'Pending'));

if ($dbId <= 0 || $title === '') {
    respond(400, 'error', null, 'Valid id and title are required.');
}

// PRIORITY CONFLICT CHECK
$conflictAdjusted = null;
$messagePrefix = 'Task updated';

$checkStmt = $pdo->prepare(
    'SELECT id FROM tasks 
     WHERE user_id = :user_id 
       AND id != :current_id
       AND deadline = :deadline 
       AND priority = :priority 
       AND status != \'Completed\'
       AND start_time < :end_time 
       AND end_time > :start_time
     LIMIT 1'
);
$checkStmt->execute([
    'user_id' => $user['id'],
    'current_id' => $dbId,
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
    $messagePrefix = "Task updated, but priority conflict detected. Adjusted to {$priority}";
}

$stmt = $pdo->prepare(
    'UPDATE tasks 
     SET title = :title, description = :description, category = :category, priority = :priority, start_time = :start_time, end_time = :end_time, deadline = :deadline, status = :status 
     WHERE id = :id AND user_id = :user_id'
);
$stmt->execute([
    'id' => $dbId,
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

if ($stmt->rowCount() === 0 && !$conflictAdjusted) {
    respond(404, 'error', null, 'Task not found, access denied or unchanged.');
}

$resData = ['id' => $idStr];
if ($conflictAdjusted) {
    $resData['conflict_adjusted'] = $conflictAdjusted;
}

respond(200, 'success', $resData, $messagePrefix);

