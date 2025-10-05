<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$student_id = $data['student_id'] ?? null;
$lastname = $data['lastname'] ?? null;

if (!$student_id || !$lastname) {
    echo json_encode(['status' => 'error', 'message' => 'Missing data']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

$newPassword = $lastname . "123";

$sql = "UPDATE students SET password = ? WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $newPassword, $student_id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'new_password' => $newPassword]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update password']);
}

$stmt->close();
$conn->close();
?>
