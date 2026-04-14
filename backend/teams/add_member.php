<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

$user = require_auth(false);
$input = input_json();

$name = trim((string)($input['name'] ?? ''));
$role = trim((string)($input['role'] ?? 'Team Member'));
$email = trim((string)($input['email'] ?? ''));

if ($name === '') {
    respond(400, 'error', null, 'Member name is required.');
}

$pdo->beginTransaction();
try {
    // Check if user exists by email or create new user
    if ($email !== '') {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $existingUser = $stmt->fetch();
        
        if ($existingUser) {
            $userId = (int)$existingUser['id'];
        } else {
            // Create new user with temporary password
            $tempPassword = password_hash('temp123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)');
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'password' => $tempPassword,
                'role' => 'user'
            ]);
            $userId = (int)$pdo->lastInsertId();
        }
    } else {
        // Create user without email
        $tempPassword = password_hash('temp123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (name, password, role) VALUES (:name, :password, :role)');
        $stmt->execute([
            'name' => $name,
            'password' => $tempPassword,
            'role' => 'user'
        ]);
        $userId = (int)$pdo->lastInsertId();
    }
    
    $pdo->commit();
    
    $newMember = [
        'id' => 'MEM-' . $userId,
        'name' => $name,
        'role' => $role,
        'total' => 0,
        'completed' => 0,
        'rate' => 0,
        'score' => 70
    ];
    
    respond(201, 'success', $newMember, 'Member added');
} catch (Exception $e) {
    $pdo->rollBack();
    respond(500, 'error', null, 'Failed to add member');
}
