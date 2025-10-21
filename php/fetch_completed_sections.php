<?php
header('Content-Type: application/json');
session_start();

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$conn = new mysqli($host, $user, $pass, $db);
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

$assigned_level = $_SESSION['assigned_level'] ?? '';

if (empty($assigned_level)) {
    echo json_encode(["error" => "Unauthorized. No assigned level in session."]);
    exit;
}

$normalized_level = preg_replace('/\s+/', ' ', strtolower(trim($assigned_level)));

if ($normalized_level === 'senior high' || $normalized_level === 'shs') {
    $normalized_level = 'Senior High';
} else {
    $normalized_level = 'Junior High';
}

$stmt = $conn->prepare("
    SELECT section_id, section_name, grade_level, assigned_level, total_students 
    FROM sections_list 
    WHERE school_year = ? 
      AND graduation_year IS NOT NULL
      AND LOWER(TRIM(assigned_level)) = LOWER(?)
    ORDER BY grade_level, section_name
");

$stmt->bind_param("ss", $school_year, $normalized_level);
$stmt->execute();
$result = $stmt->get_result();

$sections = [];
while ($row = $result->fetch_assoc()) {
    $sections[] = $row;
}

echo json_encode([
    "success" => true,
    "assigned_level" => $normalized_level,
    "sections" => $sections
]);

$stmt->close();
$conn->close();
?>
