<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$start_date = $data['start_date'] ?? null;
$end_date = $data['end_date'] ?? null;

if (!$start_date || !$end_date) {
    echo json_encode(['status' => 'error', 'message' => 'Start date and end date are required']);
    exit;
}

// Determine if today is within the period
$today = date('Y-m-d');
$is_active = ($today >= $start_date && $today <= $end_date) ? 1 : 0;

// Check if a row already exists
$result = $conn->query("SELECT id FROM school_year_periods LIMIT 1");
if ($result && $result->num_rows > 0) {
    // Update existing row
    $row = $result->fetch_assoc();
    $id = $row['id'];
    $stmt = $conn->prepare("UPDATE school_year_periods SET start_date=?, end_date=?, is_active=?, updated_at=NOW() WHERE id=?");
    $stmt->bind_param("ssii", $start_date, $end_date, $is_active, $id);
} else {
    // Insert new row
    $stmt = $conn->prepare("INSERT INTO school_year_periods (start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
    $stmt->bind_param("ssi", $start_date, $end_date, $is_active);
}

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'School year period saved', 'is_active' => $is_active]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save school year period']);
}

$stmt->close();
$conn->close();
