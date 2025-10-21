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
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $sectionName = trim($_GET['section_name'] ?? '');
    if ($sectionName === '') {
        echo json_encode(["error" => "Section name is required"]);
        exit;
    }

    // Get section info
    $stmt = $pdo->prepare("SELECT section_id, assigned_level, grade_level, semester FROM sections_list WHERE LOWER(section_name) = LOWER(?)");
    $stmt->execute([$sectionName]);
    $section = $stmt->fetch();

    if (!$section) {
        echo json_encode(["error" => "Section not found"]);
        exit;
    }

    $level = strtolower($section['assigned_level'] ?? 'jhs');

    if ($level === 'senior high') {
        $stmt = $pdo->prepare("
            SELECT 
                a.applicant_id AS student_id,
                CONCAT(a.firstname, ' ', IFNULL(CONCAT(SUBSTRING(a.middlename,1,1),'. '),''), a.lastname) AS student_name,
                a.strand,
                a.grade_level,
                a.semester,
                COALESCE(
                    (SELECT remarks FROM shs_studentgrade g 
                     WHERE g.student_id = a.applicant_id 
                     ORDER BY g.grade_id DESC LIMIT 1),
                    'passed'
                ) AS remarks
            FROM shs_applicant a
            WHERE a.section_id = ? 
            ORDER BY a.lastname, a.firstname
        ");
        $stmt->execute([$section['section_id']]);
    } else {
        $stmt = $pdo->prepare("
            SELECT 
                a.applicant_id AS student_id,
                CONCAT(a.firstname, ' ', IFNULL(CONCAT(SUBSTRING(a.middlename,1,1),'. '),''), a.lastname) AS student_name,
                a.grade_level,
                COALESCE(
                    (SELECT remarks FROM studentgrade g 
                     WHERE g.student_id = a.applicant_id 
                     ORDER BY g.grade_id DESC LIMIT 1),
                    'passed'
                ) AS remarks
            FROM jhs_applicants a
            WHERE a.section_id = ?
            ORDER BY a.lastname, a.firstname
        ");
        $stmt->execute([$section['section_id']]);
    }

    $students = $stmt->fetchAll();

    echo json_encode($students);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
