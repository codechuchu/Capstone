<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Get assigned level from session
    $assignedLevel = $_SESSION['assigned_level'] ?? '';
    if (!$assignedLevel) {
        echo json_encode(["error" => "Assigned level not found"]);
        exit;
    }

    // Define grade range based on level
    $grades = $assignedLevel === "Senior High" ? [11, 12] : [7, 8, 9, 10];

    // Fetch sections in that grade range
    $in  = str_repeat('?,', count($grades) - 1) . '?';
    $stmt = $pdo->prepare("SELECT section_id, section_name, grade_level FROM sections_list WHERE is_archived = 0 AND grade_level IN ($in) ORDER BY section_name ASC");
    $stmt->execute($grades);
    $sections = $stmt->fetchAll();

    echo json_encode($sections ?: []);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
