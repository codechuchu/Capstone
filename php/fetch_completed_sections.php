<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$school_year = $data['school_year'] ?? '';

if (!$school_year) {
    echo json_encode(["error" => "School year is required"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT section_id, section_name, grade_level, assigned_level, total_students 
    FROM sections_list 
    WHERE school_year = ? AND graduation_year IS NOT NULL
    ORDER BY grade_level, section_name
");
$stmt->bind_param("s", $school_year);
$stmt->execute();
$result = $stmt->get_result();

$sections = [];
while ($row = $result->fetch_assoc()) {
    $sections[] = $row;
}

echo json_encode(["sections" => $sections]);
$stmt->close();
$conn->close();
?>
