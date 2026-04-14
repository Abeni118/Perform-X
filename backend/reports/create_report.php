<?php
declare(strict_types=1);

require_once __DIR__ . '/../middleware/auth_check.php';
require_once __DIR__ . '/../config/database.php';

require_auth(false);
$input = input_json();

$title = trim((string)($input['title'] ?? ''));
$content = trim((string)($input['content'] ?? ''));

if ($title === '' || $content === '') {
    respond(400, 'error', null, 'Title and content are required.');
}

$stmt = $pdo->prepare('INSERT INTO reports (title, content, created_at) VALUES (:title, :content, NOW())');
$stmt->execute([
    'title' => $title,
    'content' => $content
]);

respond(201, 'success', ['id' => (int)$pdo->lastInsertId()], 'Report created');

