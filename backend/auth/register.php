<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

// 4. VERIFY BACKEND FUNCTIONALITY - Validate request method (POST only)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit;
}

$input = input_json();

// Check standard POST variable as fallback
$name = trim((string)($input['name'] ?? $_POST['name'] ?? ''));
$email = strtolower(trim((string)($input['email'] ?? $_POST['email'] ?? '')));
$password = (string)($input['password'] ?? $_POST['password'] ?? '');
$role = ((string)($input['role'] ?? $_POST['role'] ?? 'user')) === 'admin' ? 'admin' : 'user';

if ($name === '' || $email === '' || $password === '') {
    respond(400, 'error', null, 'Name, email, and password are required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, 'error', null, 'Invalid email format.');
}

if (strlen($password) < 6) {
    respond(400, 'error', null, 'Password must be at least 6 characters.');
}

// 4. VERIFY BACKEND FUNCTIONALITY - Prepared statements used
$check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$check->execute(['email' => $email]);
if ($check->fetch()) {
    respond(400, 'error', null, 'Email already exists.');
}

// 4. VERIFY BACKEND FUNCTIONALITY - Hashed passwords used
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, created_at) VALUES (:name, :email, :password, :role, NOW())');
if (!$stmt->execute([
    'name' => $name,
    'email' => $email,
    'password' => $hashed,
    'role' => $role
])) {
    respond(500, 'error', null, 'An internal server error occurred.');
}

$id = (int)$pdo->lastInsertId();
$_SESSION['user_name'] = $name;
$_SESSION['user_id'] = $id;
$_SESSION['role'] = $role;
$_SESSION['email'] = $email;
$user = [
    'id' => $id,
    'name' => $name,
    'email' => $email,
    'role' => $role
];

// 4. VERIFY BACKEND FUNCTIONALITY - Return proper JSON responses
http_response_code(201);
echo json_encode([
    'status' => 'success',
    'message' => 'Registration successful',
    'data' => $user,
    'user' => $user
]);
exit;
