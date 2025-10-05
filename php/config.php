<?php
// =============================
// 🔒 Global Config & Security
// =============================

// ✅ Error handling
ini_set('display_errors', 0);   // Hide errors from users
ini_set('log_errors', 1);       // Log errors to file
ini_set('error_log', __DIR__ . '/php_errors.log');

// ✅ Stronger session security
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');

// Only set cookie_secure if you’re using HTTPS
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}

session_start();

// ✅ Database connection
$host = "localhost";
$db   = "sulivannhs";
$user = "appuser";     // ⚠️ Change to your non-root MySQL user
$pass = "sulivannhs2025"; // ⚠️ Use a strong password
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Exceptions on error
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Use real prepared statements
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Don’t expose DB details to users
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Server error"]));
}
