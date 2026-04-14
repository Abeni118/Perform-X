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

if ($stmt->rowCount() === 0) {
    respond(404, 'error', null, 'Task not found, access denied or unchanged.');
}

respond(200, 'success', ['id' => $idStr], 'Task updated');

