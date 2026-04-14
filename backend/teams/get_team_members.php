<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);

try {
    // Get team members with their task statistics
    $stmt = $pdo->prepare('
        SELECT u.id, u.name, u.email, u.role,
               COUNT(t.id) as total_tasks,
               COUNT(CASE WHEN t.status = "Completed" THEN 1 END) as completed_tasks,
               ROUND(
                   CASE 
                       WHEN COUNT(t.id) > 0 
                       THEN (COUNT(CASE WHEN t.status = "Completed" THEN 1 END) * 100.0 / COUNT(t.id))
                       ELSE 0 
                   END, 1
               ) as completion_rate,
               70 as performance_score
        FROM users u
        LEFT JOIN team_members tm ON u.id = tm.user_id
        LEFT JOIN tasks t ON u.id = t.user_id
        WHERE u.role != "admin"
        GROUP BY u.id, u.name, u.email, u.role
        ORDER BY u.name
    ');
    $stmt->execute();
    $members = $stmt->fetchAll();
    
    // Format data for frontend
    $formattedMembers = [];
    foreach ($members as $member) {
        $formattedMembers[] = [
            'id' => 'MEM-' . $member['id'],
            'name' => $member['name'],
            'role' => $member['role'],
            'total' => (int)$member['total_tasks'],
            'completed' => (int)$member['completed_tasks'],
            'rate' => (float)$member['completion_rate'],
            'score' => (int)$member['performance_score']
        ];
    }
    
    respond(200, 'success', $formattedMembers);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch team members');
}
