<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$section_id = intval($data['section_id'] ?? 0);

if ($section_id <= 0) {
    echo json_encode(["error" => "Invalid section ID"]);
    exit;
}

// Determine assigned_level from sections_list
$secStmt = $conn->prepare("SELECT assigned_level FROM sections_list WHERE section_id = ?");
$secStmt->bind_param("i", $section_id);
$secStmt->execute();
$secResult = $secStmt->get_result();
$section = $secResult->fetch_assoc();
$secStmt->close();

if (!$section) {
    echo json_encode(["error" => "Section not found"]);
    exit;
}

$assigned_level = strtolower($section['assigned_level']);
$students = [];

if ($assigned_level === 'senior high') {
    $stmt = $conn->prepare("SELECT applicant_id AS lrn, firstname, lastname, gender, status FROM shs_applicant WHERE section_id = ? ORDER BY lastname, firstname");
} else {
    $stmt = $conn->prepare("SELECT lrn, firstname, lastname, gender, status FROM jhs_applicants WHERE section_id = ? ORDER BY lastname, firstname");
}

$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

echo json_encode(["students" => $students]);
$stmt->close();
$conn->close();
?>
