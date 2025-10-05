<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

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
    // Delete matching rows in class_schedules
    $delStmt = $conn->prepare("DELETE FROM class_schedules WHERE section_id = ?");
    $delStmt->bind_param("i", $section_id);
    $delStmt->execute();
    $delStmt->close();

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
