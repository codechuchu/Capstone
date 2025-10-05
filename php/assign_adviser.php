<?php
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$section_id = intval($input['section_id'] ?? 0);
$teacher_id = intval($input['teacher_id'] ?? 0);

if (!$section_id || !$teacher_id) {
    echo json_encode(["status" => "error", "message" => "Invalid section or teacher ID"]);
    exit();
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Update section with adviser (or INSERT if new; adjust as needed)
$stmt = $conn->prepare("UPDATE sections SET adviser_id = ? WHERE section_id = ?");
$stmt->bind_param("ii", $teacher_id, $section_id);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(["status" => "success", "message" => "Adviser assigned successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to assign adviser"]);
}

$stmt->close();
$conn->close();
?>
