<?php
header('Content-Type: application/json');
session_start();

// Get query parameters
$level = $_GET['level'] ?? '';
$grade = $_GET['grade'] ?? '';

// Validate input
if (!$level || !$grade) {
    echo json_encode([]);
    exit;
}

// Database connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

// Determine table
$table = $level === "Senior High" ? "shs_applicant" : "jhs_applicants";

// Prepare query
$sql = "SELECT applicant_id AS id, CONCAT(firstname, ' ', lastname) AS name, grade_level 
        FROM $table WHERE grade_level = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([]);
    exit;
}

$stmt->bind_param("i", $grade);
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

echo json_encode($students);
$conn->close();
?>
