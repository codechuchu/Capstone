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
    $stmt = $pdo->prepare("SELECT section_id, assigned_level FROM sections_list WHERE LOWER(section_name) = LOWER(?)");
    $stmt->execute([$sectionName]);
    $section = $stmt->fetch();

    if (!$section) {
        echo json_encode(["error" => "Section not found"]);
        exit;
    }

    $sectionId = $section['section_id'];
    $level = strtolower($section['assigned_level'] ?? 'jhs');

    // Fetch students depending on level
    if ($level === 'senior high') {
        $stmt = $pdo->prepare("
            SELECT applicant_id AS student_id, CONCAT(firstname, ' ', middlename, ' ', lastname) AS student_name,
                   strand, grade_level, status
            FROM shs_applicant
            WHERE section_id = ?
            ORDER BY student_name
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT applicant_id AS student_id, CONCAT(firstname, ' ', middlename, ' ', lastname) AS student_name,
                   NULL AS strand, grade_level, status
            FROM jhs_applicants
            WHERE section_id = ?
            ORDER BY student_name
        ");
    }

    $stmt->execute([$sectionId]);
    $students = $stmt->fetchAll();

    echo json_encode($students);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
