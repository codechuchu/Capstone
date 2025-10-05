<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$currentPassword = $data['current_password'] ?? '';
$newPassword = $data['new_password'] ?? '';

if (!$currentPassword || !$newPassword) {
    echo json_encode(['success' => false, 'message' => 'Both current and new passwords are required']);
    exit;
}

// DB connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];

// Verify current password
$stmt = $conn->prepare("SELECT * FROM $role WHERE " . ($role === 'students' ? 'student_id' : ($role === 'teachers' ? 'teacher_id' : 'id')) . " = ? AND password = ?");
$stmt->bind_param("is", $userId, $currentPassword);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Update password
$updateStmt = $conn->prepare("UPDATE $role SET password = ? WHERE " . ($role === 'students' ? 'student_id' : ($role === 'teachers' ? 'teacher_id' : 'id')) . " = ?");
$updateStmt->bind_param("si", $newPassword, $userId);

if ($updateStmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update password']);
}

$updateStmt->close();
$conn->close();
?>
