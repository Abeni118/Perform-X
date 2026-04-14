<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);

$userId = $user['id'];

$stmtTotal = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid');
$stmtTotal->execute(['uid' => $userId]);
$totalTasks = (int)$stmtTotal->fetchColumn();

$stmtCompleted = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid AND status = "Completed"');
$stmtCompleted->execute(['uid' => $userId]);
$completedTasks = (int)$stmtCompleted->fetchColumn();

$stmtPending = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid AND status IN ("Pending", "In Progress", "Delayed")');
$stmtPending->execute(['uid' => $userId]);
$pendingTasks = (int)$stmtPending->fetchColumn();

// Get real task data for charts
$stmtWeek = $pdo->prepare('
    SELECT DAYOFWEEK(deadline) as day_of_week, COUNT(*) as count 
    FROM tasks 
    WHERE user_id = :uid AND deadline >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DAYOFWEEK(deadline)
');
$stmtWeek->execute(['uid' => $userId]);
$weekData = $stmtWeek->fetchAll();

// Initialize weekly data (Sunday=1 to Saturday=7)
$weeklyVelocity = [0, 0, 0, 0, 0, 0, 0];
foreach ($weekData as $wd) {
    $dayIndex = ($wd['day_of_week'] + 5) % 7; // Convert to 0=Sunday format
    $weeklyVelocity[$dayIndex] = (int)$wd['count'];
}

// Monthly throughput (last 12 months)
$monthlyThroughput = array_fill(0, 12, 0);
$stmtMonth = $pdo->prepare('
    SELECT MONTH(deadline) as month, COUNT(*) as count 
    FROM tasks 
    WHERE user_id = :uid AND deadline >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY MONTH(deadline)
');
$stmtMonth->execute(['uid' => $userId]);
$monthData = $stmtMonth->fetchAll();
foreach ($monthData as $md) {
    $monthIndex = ((int)$md['month'] - (int)date('m') + 12) % 12;
    $monthlyThroughput[$monthIndex] = (int)$md['count'];
}

$performanceScore = 88; // Could be generated from performance table
if ($totalTasks > 0) {
    $performanceScore = round(($completedTasks / $totalTasks) * 100, 2);
}

respond(200, 'success', [
    'total_tasks' => $totalTasks,
    'completed_tasks' => $completedTasks,
    'pending_tasks' => $pendingTasks,
    'performance_score' => $performanceScore,
    'charts' => [
         'weekly_velocity' => $weeklyVelocity,
         'monthly_throughput' => $monthlyThroughput
    ]
]);
