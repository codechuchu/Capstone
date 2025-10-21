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

    $section_id = $section['section_id'];
    $level = strtolower($section['assigned_level'] ?? 'jhs');

    // Step 1: Get student IDs from archived_section_students table
    $stmt = $pdo->prepare("SELECT student_id FROM archived_section_students WHERE section_name = ?");
    $stmt->execute([$sectionName]);
    $studentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!$studentIds) {
        echo json_encode(["error" => "No matching students found in the archived section"]);
        exit;
    }

    $idsPlaceholder = implode(',', array_fill(0, count($studentIds), '?'));

    // Step 2: Fetch full student info from main applicant tables, including status
    if ($level === 'senior high') {
        $table = 'shs_applicant';
        $remarksTable = 'shs_studentgrade';
        $sql = "
            SELECT 
                a.applicant_id,
                CONCAT(a.firstname, ' ', IFNULL(CONCAT(SUBSTRING(a.middlename,1,1),'. '),''), a.lastname) AS student_name,
                a.strand,
                a.grade_level,
                a.semester,
                a.status,  -- added status
                COALESCE(
                    (SELECT remarks FROM $remarksTable g WHERE g.student_id = a.applicant_id ORDER BY g.grade_id DESC LIMIT 1),
                    'passed'
                ) AS remarks
            FROM $table a
            WHERE a.applicant_id IN ($idsPlaceholder)
            ORDER BY a.lastname, a.firstname
        ";
    } else {
        $table = 'jhs_applicants';
        $remarksTable = 'studentgrade';
        $sql = "
            SELECT 
                a.applicant_id,
                CONCAT(a.firstname, ' ', IFNULL(CONCAT(SUBSTRING(a.middlename,1,1),'. '),''), a.lastname) AS student_name,
                NULL AS strand,
                a.grade_level,
                NULL AS semester,
                a.status,  -- added status
                COALESCE(
                    (SELECT remarks FROM $remarksTable g WHERE g.student_id = a.applicant_id ORDER BY g.grade_id DESC LIMIT 1),
                    'passed'
                ) AS remarks
            FROM $table a
            WHERE a.applicant_id IN ($idsPlaceholder)
            ORDER BY a.lastname, a.firstname
        ";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($studentIds);
    $students = $stmt->fetchAll();

    echo json_encode($students);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
