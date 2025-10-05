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

    $sectionId = intval($_GET['section_id'] ?? 0);
    if (!$sectionId) {
        echo json_encode(["error" => "Section ID is required"]);
        exit;
    }

    // Fetch students from the section table
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
?>
