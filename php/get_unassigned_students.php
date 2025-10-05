<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
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

    $sectionId = $_GET['section_id'] ?? null;
    if (!$sectionId) {
        echo json_encode(["error" => "Missing section_id"]);
        exit;
    }

    // Get the section’s strand & grade_level
    $stmt = $pdo->prepare("SELECT strand, grade_level FROM sections_list WHERE section_id = :section_id");
    $stmt->execute([':section_id' => $sectionId]);
    $section = $stmt->fetch();

    if (!$section) {
        echo json_encode(["error" => "Invalid section_id"]);
        exit;
    }

    $strand = $section['strand'];
    $gradeLevel = $section['grade_level'];

    // Retrieve only enrolled + unassigned students that match strand + grade_level
    $stmt = $pdo->prepare("
        SELECT applicant_id AS student_id,
               CONCAT(firstname, ' ', lastname) AS student_name,
               strand,
               grade_level
        FROM shs_applicant
        WHERE section_id IS NULL
          AND status = 'enrolled'
          AND strand = :strand
          AND grade_level = :grade_level
    ");
    $stmt->execute([
        ':strand' => $strand,
        ':grade_level' => $gradeLevel
    ]);

    $students = $stmt->fetchAll();
    echo json_encode($students);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
