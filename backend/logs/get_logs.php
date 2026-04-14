<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

require_auth(true);

try {
    // Create a logs table if it doesn't exist for demonstration
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS system_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            type VARCHAR(50) DEFAULT 'INFO',
            component VARCHAR(100) DEFAULT 'System',
            summary TEXT,
            status ENUM('Info', 'Warning', 'Error', 'Success') DEFAULT 'Info',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Insert some sample logs if table is empty
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM system_logs");
    $count = $countStmt->fetch()['count'];
    
    if ($count == 0) {
        $sampleLogs = [
            ['type' => 'INFO', 'component' => 'Authentication', 'summary' => 'User login successful', 'status' => 'Success'],
            ['type' => 'WARNING', 'component' => 'Database', 'summary' => 'Connection pool near capacity', 'status' => 'Warning'],
            ['type' => 'ERROR', 'component' => 'API', 'summary' => 'Failed request processing', 'status' => 'Error'],
            ['type' => 'INFO', 'component' => 'System', 'summary' => 'Scheduled backup completed', 'status' => 'Success'],
            ['type' => 'WARNING', 'component' => 'Security', 'summary' => 'Multiple failed login attempts', 'status' => 'Warning']
        ];
        
        $insertStmt = $pdo->prepare("INSERT INTO system_logs (type, component, summary, status) VALUES (?, ?, ?, ?)");
        foreach ($sampleLogs as $log) {
            $insertStmt->execute([$log['type'], $log['component'], $log['summary'], $log['status']]);
        }
    }
    
    $stmt = $pdo->query('SELECT timestamp, type, component, summary, status FROM system_logs ORDER BY timestamp DESC LIMIT 50');
    $logs = $stmt->fetchAll();
    
    respond(200, 'success', $logs);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch logs');
}
