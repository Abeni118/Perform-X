<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

require_auth(true);

try {
    // Create reports table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS compliance_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            requester VARCHAR(100) NOT NULL,
            purpose TEXT NOT NULL,
            date DATE NOT NULL,
            status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Insert sample data if empty
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM compliance_reports");
    $count = $countStmt->fetch()['count'];
    
    if ($count == 0) {
        $sampleReports = [
            ['requester' => 'John Doe', 'purpose' => 'Quarterly financial audit', 'date' => '2024-01-15', 'status' => 'Approved'],
            ['requester' => 'Jane Smith', 'purpose' => 'Security compliance review', 'date' => '2024-01-20', 'status' => 'Pending'],
            ['requester' => 'Mike Johnson', 'purpose' => 'Data privacy assessment', 'date' => '2024-01-25', 'status' => 'Denied'],
            ['requester' => 'Sarah Wilson', 'purpose' => 'Regulatory compliance check', 'date' => '2024-02-01', 'status' => 'Pending'],
            ['requester' => 'Automated Scanner', 'purpose' => 'Scheduled policy conformance scan', 'date' => '2024-02-05', 'status' => 'Pending']
        ];
        
        $insertStmt = $pdo->prepare("INSERT INTO compliance_reports (requester, purpose, date, status) VALUES (?, ?, ?, ?)");
        foreach ($sampleReports as $report) {
            $insertStmt->execute([$report['requester'], $report['purpose'], $report['date'], $report['status']]);
        }
    }
    
    $stmt = $pdo->query('SELECT CONCAT("ARQ-", id) as id, requester, purpose, date, status FROM compliance_reports ORDER BY id DESC');
    $reports = $stmt->fetchAll();
    
    respond(200, 'success', $reports);
} catch (PDOException $e) {
    respond(500, 'error', null, 'Failed to fetch reports');
}

