<?php
header('Content-Type: application/json');

// XAMPP Database credentials
$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "sulivannhs";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Get section_name from GET
$section_name = $_GET['section_name'] ?? '';

if (empty($section_name)) {
    echo json_encode(['success' => false, 'message' => 'Section name is required']);
    exit;
}

// Fetch grade level and semester from sections_list
$stmt = $conn->prepare("SELECT grade_level, semester FROM sections_list WHERE section_name = ? LIMIT 1");
$stmt->bind_param("s", $section_name);
$stmt->execute();
$result = $stmt->get_result();
$section = $result->fetch_assoc();

if ($section) {
    echo json_encode(['success' => true, 'data' => $section]);
} else {
    echo json_encode(['success' => false, 'message' => 'Section not found']);
}

$stmt->close();
$conn->close();
?>
