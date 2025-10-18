<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

include_once __DIR__ . '/log_audit.php'; // Include audit log

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);
$section_id = intval($data['section_id'] ?? 0);

if ($section_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid section ID']);
    exit;
}

// Fetch section info (name, grade_level, assigned_level, school_year)
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

// Use the section's school_year as graduation_year
$graduation_year = $section['school_year'];

// Archive section and add graduation_year
$archiveStmt = $conn->prepare("UPDATE sections_list SET is_archived = 1, graduation_year = ? WHERE section_id = ?");
$archiveStmt->bind_param("si", $graduation_year, $section_id);

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
    "Section ID: $section_id archived with graduation year $graduation_year"
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

// Update student status to graduated
if (strtolower($section['assigned_level']) === 'senior high') {
    // SHS: grade_level 12 + semester 2
    $updateShs = $conn->prepare("
        UPDATE shs_applicant
        SET status = 'graduated'
        WHERE section_id = ? AND grade_level = 12 AND semester = 2
    ");
    $updateShs->bind_param("i", $section_id);
    $updateShs->execute();
    $updateShs->close();
} else {
    // JHS: grade_level 10
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

echo json_encode(['success' => true]);
$conn->close();
?>
