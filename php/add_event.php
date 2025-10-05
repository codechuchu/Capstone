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

    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    // Don’t expose DB internals
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>
