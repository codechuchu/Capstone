<?php
ini_set('display_errors', 0); // Hide errors in production
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();

// 🔒 AUTH CHECK: only allow logged-in admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

// Include audit logging
include_once __DIR__ . '/log_audit.php';

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['title'], $data['start_date'], $data['end_date'])) {
        echo json_encode(["status" => "error", "message" => "Missing fields"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO events (title, start_date, end_date) VALUES (?, ?, ?)");
    $stmt->execute([$data['title'], $data['start_date'], $data['end_date']]);

    // ✅ Log audit
    $user_id  = $_SESSION['user_id'];
    $username = $_SESSION['email'];
    $role     = $_SESSION['role'];
    $action   = "Added Event";
    $details  = "Title: {$data['title']}, Start: {$data['start_date']}, End: {$data['end_date']}";
    
    // Since logAction uses mysqli, create a temporary mysqli connection
    $conn = new mysqli("localhost", "root", "", "sulivannhs");
    logAction($conn, $user_id, $username, $role, $action, $details);
    $conn->close();

    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
