<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

$input = input_json();
$identifier = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');

if ($identifier === '' || $password === '') {
    respond(400, 'error', null, 'Email and password are required.');
}

// Debug logging
error_log("Login attempt for email: " . $identifier);

$stmt = $pdo->prepare('
    SELECT id, name, email, password, role
    FROM users
    WHERE LOWER(email) = :identifier
    LIMIT 1
');
$stmt->execute(['identifier' => $identifier]);
$user = $stmt->fetch();

error_log("User found: " . ($user ? "YES (ID: " . $user['id'] . ")" : "NO"));

if (!$user) {
    error_log("Login failed: User not found");
    respond(401, 'error', null, 'Invalid credentials.');
}

$passwordValid = password_verify($password, $user['password']);
error_log("Password verification: " . ($passwordValid ? "SUCCESS" : "FAILED"));

if (!$passwordValid) {
    error_log("Login failed: Invalid password");
    respond(401, 'error', null, 'Invalid credentials.');
}

$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['user_name'] = (string)$user['name'];
$_SESSION['role'] = (string)$user['role'];
$_SESSION['email'] = (string)$user['email'];

error_log("Login successful: Session set for user ID " . $user['id'] . ", name: " . $user['name']);

unset($user['password']);
http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'data' => $user,
    'user' => $user
]);
exit;

