<?php
session_start();
header('Content-Type: application/json');

// Check if teacher is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teachers') {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as teacher']);
    exit;
}

$section_id = intval($_GET['section_id'] ?? 0);
if (!$section_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid section_id']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

$students = [];

// --- SHS applicants ---
$sqlShs = "
    SELECT a.applicant_id, a.firstname, a.lastname, s.email, s.password
    FROM shs_applicant a
    JOIN students s ON a.applicant_id = s.student_id
    WHERE a.section_id = ?
";
$stmt = $conn->prepare($sqlShs);
$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}
$stmt->close();

// --- JHS applicants ---
$sqlJhs = "
    SELECT a.applicant_id, a.firstname, a.lastname, s.email, s.password
    FROM jhs_applicants a
    JOIN students s ON a.applicant_id = s.student_id
    WHERE a.section_id = ?
";
$stmt = $conn->prepare($sqlJhs);
$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}
$stmt->close();

$conn->close();

echo json_encode(['status' => 'success', 'students' => $students]);
