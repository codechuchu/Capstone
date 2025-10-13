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

// Update the section to archive it
$stmt = $conn->prepare("UPDATE sections_list SET is_archived = 1 WHERE section_id = ?");
$stmt->bind_param("i", $section_id);

if ($stmt->execute()) {
    // Audit: Section archived
    $action = "Archived Section";
    $details = "Section ID: $section_id archived by user: " . ($_SESSION['user_id'] ?? 'unknown');
    logAction($conn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);

    // Delete matching rows in class_schedules
    $delStmt = $conn->prepare("DELETE FROM class_schedules WHERE section_id = ?");
    $delStmt->bind_param("i", $section_id);
    $delStmt->execute();

    // Audit: Class schedules deleted
    $action = "Deleted Class Schedules";
    $details = "Deleted schedules for Section ID: $section_id";
    logAction($conn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);

    $delStmt->close();
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
