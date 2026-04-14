<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth_check.php';

error_log("Session check requested");

$user = require_auth(false);

error_log("Session check result: " . ($user ? "User found: " . $user['name'] : "No user found"));

respond(200, 'success', $user, 'Session active');

