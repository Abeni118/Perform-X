<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

require_auth(false);

try {
    $stmt = $pdo->query('
        SELECT t.id, t.name, t.created_at, 
               GROUP_CONCAT(tm.user_id) as member_ids
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        GROUP BY t.id
        ORDER BY t.id DESC
    ');
    $teams = $stmt->fetchAll();
    
    foreach ($teams as &$team) {
        if ($team['member_ids']) {
            $team['members'] = array_map('intval', explode(',', $team['member_ids']));
        } else {
            $team['members'] = [];
        }
        unset($team['member_ids']);
    }
    
    respond(200, 'success', $teams);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch teams');
}

