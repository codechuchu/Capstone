<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);
header('Content-Type: application/json');
session_start();


$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

include_once __DIR__ . '/log_audit.php';

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);
$section_id = intval($data['section_id'] ?? 0);

if ($section_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid section ID']);
    exit;
}

// Fetch section info
$secStmt = $conn->prepare("SELECT section_name, grade_level, assigned_level, school_year FROM sections_list WHERE section_id = ?");
$secStmt->bind_param("i", $section_id);
$secStmt->execute();
$secResult = $secStmt->get_result();
$section = $secResult->fetch_assoc();
$secStmt->close();

if (!$section) {
    echo json_encode(['success' => false, 'error' => 'Section not found']);
    exit;
}

$shouldGraduate = false;

// Determine if this section is graduating
if (strtolower($section['assigned_level']) === 'senior high' && intval($section['grade_level']) === 12) {
    $shouldGraduate = true;
} elseif (strtolower($section['assigned_level']) !== 'senior high' && intval($section['grade_level']) === 10) {
    $shouldGraduate = true;
}

// Only set graduation_year if graduating
if ($shouldGraduate) {
    $graduation_year = $section['school_year'];
    $archiveStmt = $conn->prepare("UPDATE sections_list SET is_archived = 1, graduation_year = ? WHERE section_id = ?");
    $archiveStmt->bind_param("si", $graduation_year, $section_id);
} else {
    $archiveStmt = $conn->prepare("UPDATE sections_list SET is_archived = 1 WHERE section_id = ?");
    $archiveStmt->bind_param("i", $section_id);
}

if (!$archiveStmt->execute()) {
    echo json_encode(['success' => false, 'error' => $archiveStmt->error]);
    $archiveStmt->close();
    exit;
}
$archiveStmt->close();

// Audit: Section archived
logAction(
    $conn,
    $_SESSION['user_id'] ?? 0,
    $_SESSION['email'] ?? 'unknown',
    $_SESSION['role'] ?? 'unknown',
    "Archived Section",
    "Section ID: $section_id archived" . ($shouldGraduate ? " with graduation year $graduation_year" : "")
);

// Delete class schedules
$delStmt = $conn->prepare("DELETE FROM class_schedules WHERE section_id = ?");
$delStmt->bind_param("i", $section_id);
$delStmt->execute();
$delStmt->close();

// Audit: Class schedules deleted
logAction(
    $conn,
    $_SESSION['user_id'] ?? 0,
    $_SESSION['email'] ?? 'unknown',
    $_SESSION['role'] ?? 'unknown',
    "Deleted Class Schedules",
    "Deleted schedules for Section ID: $section_id"
);

// Update student status to graduated only if graduating
if ($shouldGraduate) {
    if (strtolower($section['assigned_level']) === 'senior high') {
        $updateShs = $conn->prepare("
            UPDATE shs_applicant
            SET status = 'graduated'
            WHERE section_id = ? AND grade_level = 12 AND semester = 2
        ");
        $updateShs->bind_param("i", $section_id);
        $updateShs->execute();
        $updateShs->close();
    } else {
        $updateJhs = $conn->prepare("
            UPDATE jhs_applicants
            SET status = 'graduated'
            WHERE section_id = ? AND grade_level = 10
        ");
        $updateJhs->bind_param("i", $section_id);
        $updateJhs->execute();
        $updateJhs->close();
    }

    // Audit: Updated student statuses
    logAction(
        $conn,
        $_SESSION['user_id'] ?? 0,
        $_SESSION['email'] ?? 'unknown',
        $_SESSION['role'] ?? 'unknown',
        "Updated Student Status",
        "Updated student statuses to 'graduated' for Section ID: $section_id"
    );
}

// Archive SHS students
$conn->query("
    INSERT INTO archived_section_students (section_name, student_id, student_name, grade_level, semester, strand, level)
    SELECT 
        '{$section['section_name']}' AS section_name,
        applicant_id AS student_id,
        CONCAT(firstname, ' ', IFNULL(CONCAT(SUBSTRING(middlename,1,1),'. '),''), lastname) AS student_name,
        grade_level,
        semester,
        strand,
        'SHS' AS level
    FROM shs_applicant
    WHERE section_id = $section_id
");

// Archive SHS students into archived_students
$result = $conn->query("
    INSERT INTO archived_students (applicant_id, section_id, assigned_level, grade_level, semester)
    SELECT 
        applicant_id,
        $section_id AS section_id,
        'SHS' AS assigned_level,
        grade_level,
        1 AS semester
    FROM shs_applicant
    WHERE section_id = $section_id
");
if (!$result) {
    echo json_encode(['success' => false, 'error' => 'SHS insert failed: ' . $conn->error]);
    exit;
}

// Archive JHS students into archived_students
$result = $conn->query("
    INSERT INTO archived_students (applicant_id, section_id, assigned_level, grade_level, semester)
    SELECT 
        applicant_id,
        $section_id AS section_id,
        'JHS' AS assigned_level,
        grade_level,
        NULL AS semester
    FROM jhs_applicants
    WHERE section_id = $section_id
");
if (!$result) {
    echo json_encode(['success' => false, 'error' => 'JHS insert failed: ' . $conn->error]);
    exit;
}

if (!$result) {
    echo json_encode(['success' => false, 'error' => 'SHS insert failed: ' . $conn->error]);
    exit;
}

// Archive JHS students into archived_students
$result = $conn->query("
    INSERT INTO archived_students (applicant_id, section_id, assigned_level, grade_level, semester)
    SELECT 
        applicant_id,
        section_id,
        assigned_level,
        grade_level,
        semester
    FROM jhs_applicants
    WHERE section_id = $section_id
");
if (!$result) {
    echo json_encode(['success' => false, 'error' => 'JHS insert failed: ' . $conn->error]);
    exit;
}

echo json_encode(['success' => true]);
$conn->close();
exit; // ensures nothing else is sent

?>
