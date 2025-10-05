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

    if (!isset($_SESSION['assigned_level'])) {
        echo json_encode(["error" => "No assigned level in session."]);
        exit;
    }

    $assignedLevel = strtolower($_SESSION['assigned_level']);
    $sections = [];

    if ($assignedLevel === "junior high") {
        // Grade levels 7–10
        $stmt = $pdo->query("SELECT section_id, section_name, strand_id, grade_level 
                             FROM sections_list 
                             WHERE is_archived = 0 AND grade_level BETWEEN 7 AND 10
                             ORDER BY section_name ASC");
        $sections = $stmt->fetchAll();
    } elseif ($assignedLevel === "senior high") {
        // Grade levels 11–12
        $stmt = $pdo->query("SELECT section_id, section_name, strand_id, grade_level 
                             FROM sections_list 
                             WHERE is_archived = 0 AND grade_level BETWEEN 11 AND 12
                             ORDER BY section_name ASC");
        $sections = $stmt->fetchAll();
    }

    echo json_encode($sections ?: []);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
