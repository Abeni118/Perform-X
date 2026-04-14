<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);
$input = input_json();

$name = trim((string)($input['name'] ?? ''));
$members = $input['members'] ?? [];
if (!is_array($members)) $members = [];

if ($name === '') {
    respond(400, 'error', null, 'Team name is required.');
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('INSERT INTO teams (name) VALUES (:name)');
    $stmt->execute(['name' => $name]);
    $teamId = (int)$pdo->lastInsertId();

    $stmtMember = $pdo->prepare('INSERT IGNORE INTO team_members (user_id, team_id) VALUES (:user_id, :team_id)');
    foreach ($members as $userId) {
        $userIdInt = (int)$userId;
        if ($userIdInt > 0) {
            $stmtMember->execute([
                'user_id' => $userIdInt,
                'team_id' => $teamId
            ]);
        }
    }
    $pdo->commit();
    respond(201, 'success', ['id' => $teamId], 'Team created');
} catch (Exception $e) {
    $pdo->rollBack();
    respond(500, 'error', null, 'Failed to create team');
}

