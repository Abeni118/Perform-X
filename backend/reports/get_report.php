<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);
$userId = $user['id'];

try {
    // Get task statistics
    $stmtTotal = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid');
    $stmtTotal->execute(['uid' => $userId]);
    $totalTasks = (int)$stmtTotal->fetchColumn();

    $stmtCompleted = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid AND status = "Completed"');
    $stmtCompleted->execute(['uid' => $userId]);
    $completedTasks = (int)$stmtCompleted->fetchColumn();

    $stmtPending = $pdo->prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = :uid AND status IN ("Pending", "In Progress", "Delayed")');
    $stmtPending->execute(['uid' => $userId]);
    $pendingTasks = (int)$stmtPending->fetchColumn();

    // Get weekly performance data
    $stmtWeek = $pdo->prepare('
        SELECT DAYOFWEEK(deadline) as day_of_week, 
               COUNT(*) as total_tasks,
               COUNT(CASE WHEN status = "Completed" THEN 1 END) as completed_tasks
        FROM tasks 
        WHERE user_id = :uid AND deadline >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DAYOFWEEK(deadline)
    ');
    $stmtWeek->execute(['uid' => $userId]);
    $weekData = $stmtWeek->fetchAll();

    // Initialize weekly data (Sunday=1 to Saturday=7)
    $weeklyPerformance = [0, 0, 0, 0, 0, 0, 0];
    foreach ($weekData as $wd) {
        $dayIndex = ($wd['day_of_week'] + 5) % 7; // Convert to 0=Sunday format
        if ($wd['total_tasks'] > 0) {
            $weeklyPerformance[$dayIndex] = round(($wd['completed_tasks'] / $wd['total_tasks']) * 100);
        }
    }

    // Get monthly benchmarks
    $stmtMonth = $pdo->prepare('
        SELECT MONTH(deadline) as month, 
               COUNT(*) as total_tasks,
               COUNT(CASE WHEN status = "Completed" THEN 1 END) as completed_tasks
        FROM tasks 
        WHERE user_id = :uid AND deadline >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY MONTH(deadline)
        ORDER BY MONTH(deadline)
    ');
    $stmtMonth->execute(['uid' => $userId]);
    $monthData = $stmtMonth->fetchAll();

    $monthlyTargets = [];
    $monthlyActuals = [];
    foreach ($monthData as $md) {
        $monthlyTargets[] = 80; // Target 80% completion
        if ($md['total_tasks'] > 0) {
            $monthlyActuals[] = round(($md['completed_tasks'] / $md['total_tasks']) * 100);
        } else {
            $monthlyActuals[] = 0;
        }
    }

    // Calculate performance score
    $performanceScore = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

    respond(200, 'success', [
        'total_tasks' => $totalTasks,
        'completed_tasks' => $completedTasks,
        'pending_tasks' => $pendingTasks,
        'performance_score' => $performanceScore,
        'weekly_performance' => $weeklyPerformance,
        'monthly_targets' => $monthlyTargets,
        'monthly_actuals' => $monthlyActuals
    ]);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch report data');
}
