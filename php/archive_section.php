<?php
header('Content-Type: application/json');
session_start();

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
$pdo = new PDO($dsn, $user, $pass, $options);

include_once __DIR__ . '/log_audit.php';

$data = json_decode(file_get_contents('php://input'), true);
$section_id = intval($data['section_id'] ?? 0);

if ($section_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid section ID']);
    exit;
}

$secStmt = $pdo->prepare("SELECT section_name, grade_level, assigned_level, school_year FROM sections_list WHERE section_id = ?");
$secStmt->execute([$section_id]);
$section = $secStmt->fetch();

if (!$section) {
    echo json_encode(['success' => false, 'error' => 'Section not found']);
    exit;
}

$shouldGraduate = false;

if (strtolower($section['assigned_level']) === 'senior high' && intval($section['grade_level']) === 12) {
    $shouldGraduate = true;
} elseif (strtolower($section['assigned_level']) !== 'senior high' && intval($section['grade_level']) === 10) {
    $shouldGraduate = true;
}

if ($shouldGraduate) {
    $graduation_year = $section['school_year'];
    $archiveStmt = $pdo->prepare("UPDATE sections_list SET is_archived = 1, graduation_year = ? WHERE section_id = ?");
    $archiveStmt->execute([$graduation_year, $section_id]);
} else {
    $archiveStmt = $pdo->prepare("UPDATE sections_list SET is_archived = 1 WHERE section_id = ?");
    $archiveStmt->execute([$section_id]);
}

logAction(
    $pdo,
    $_SESSION['user_id'] ?? 0,
    $_SESSION['email'] ?? 'unknown',
    $_SESSION['role'] ?? 'unknown',
    "Archived Section",
    "Section ID: $section_id archived" . ($shouldGraduate ? " with graduation year $graduation_year" : "")
);

$delStmt = $pdo->prepare("DELETE FROM class_schedules WHERE section_id = ?");
$delStmt->execute([$section_id]);

logAction(
    $pdo,
    $_SESSION['user_id'] ?? 0,
    $_SESSION['email'] ?? 'unknown',
    $_SESSION['role'] ?? 'unknown',
    "Deleted Class Schedules",
    "Deleted schedules for Section ID: $section_id"
);

if ($shouldGraduate) {
    if (strtolower($section['assigned_level']) === 'senior high') {
        $updateShs = $pdo->prepare("
            UPDATE shs_applicant
            SET status = 'graduated'
            WHERE section_id = ? AND grade_level = 12 AND semester = 2
        ");
        $updateShs->execute([$section_id]);
    } else {
        $updateJhs = $pdo->prepare("
            UPDATE jhs_applicants
            SET status = 'graduated'
            WHERE section_id = ? AND grade_level = 10
        ");
        $updateJhs->execute([$section_id]);
    }

    logAction(
        $pdo,
        $_SESSION['user_id'] ?? 0,
        $_SESSION['email'] ?? 'unknown',
        $_SESSION['role'] ?? 'unknown',
        "Updated Student Status",
        "Updated student statuses to 'graduated' for Section ID: $section_id"
    );
}

$pdo->exec("
    INSERT INTO archived_section_students (section_name, student_id, student_name, grade_level, semester, strand, level)
    SELECT 
        '{$section['section_name']}',
        applicant_id,
        CONCAT(firstname, ' ', IFNULL(CONCAT(SUBSTRING(middlename,1,1),'. '),''), lastname),
        grade_level,
        semester,
        strand,
        'SHS'
    FROM shs_applicant
    WHERE section_id = $section_id
");

$result = $pdo->exec("
    INSERT INTO archived_students (applicant_id, section_id, assigned_level, grade_level, semester)
    SELECT 
        applicant_id,
        $section_id,
        'SHS',
        grade_level,
        1
    FROM shs_applicant
    WHERE section_id = $section_id
");

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'SHS insert failed']);
    exit;
}

$result = $pdo->exec("
    INSERT INTO archived_students (applicant_id, section_id, assigned_level, grade_level, semester)
    SELECT 
        applicant_id,
        $section_id,
        'JHS',
        grade_level,
        NULL
    FROM jhs_applicants
    WHERE section_id = $section_id
");

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'JHS insert failed']);
    exit;
}

$result = $pdo->exec("
    INSERT INTO archived_section_students (section_name, student_id, student_name, grade_level, semester, strand, level)
    SELECT 
        '{$section['section_name']}',
        applicant_id,
        CONCAT(firstname, ' ', IFNULL(CONCAT(SUBSTRING(middlename,1,1),'. '),''), lastname),
        grade_level,
        NULL,
        NULL,
        'JHS'
    FROM jhs_applicants
    WHERE section_id = $section_id
");

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'JHS insert failed']);
    exit;
}

echo json_encode(['success' => true]);
?>
