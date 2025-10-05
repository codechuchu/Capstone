<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'teachers') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$section_id = intval($_GET['section_id'] ?? 0);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Fetch attendance and cast status to integer
$stmt = $conn->prepare("SELECT student_id, attendance_date, status FROM attendance WHERE section_id = ?");
$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();

$attendance = [];
while ($row = $result->fetch_assoc()) {
    $attendance[] = [
        'student_id' => (int)$row['student_id'],
        'attendance_date' => $row['attendance_date'],
        'status' => (int)$row['status']  // Cast to integer
    ];
}

echo json_encode($attendance);
