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

    $sectionName = trim($_GET['section_name'] ?? '');
    if ($sectionName === '') {
        echo json_encode(["error" => "Section name is required"]);
        exit;
    }

    // Case-insensitive search for the section
    $stmt = $pdo->prepare("SELECT section_id FROM sections_list WHERE LOWER(section_name) = LOWER(?)");
    $stmt->execute([$sectionName]);
    $section = $stmt->fetch();

    if (!$section) {
        echo json_encode(["error" => "Section not found"]);
        exit;
    }

    $sectionId = $section['section_id'];

    // Fetch students in that section
    $stmt = $pdo->prepare("
        SELECT student_id, student_name, strand, grade_level
        FROM section
        WHERE section_id = ?
        ORDER BY student_name
    ");
    $stmt->execute([$sectionId]);
    $students = $stmt->fetchAll();

    echo json_encode($students);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
