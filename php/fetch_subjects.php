<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$assigned_level = $_SESSION['assigned_level'] ?? '';

$subjects = [];

if (strtolower($assigned_level) === 'junior high') {
    // ✅ JHS table (only subject_name)
    $sql = "SELECT subject_id, subject_name AS name FROM jhs_subjects";
} else {
    // ✅ SHS table
    $sql = "SELECT subject_id, subcode, name, strand_id FROM subjects";
}

$result = $conn->query($sql);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $subjects[] = $row;
    }
}

echo json_encode(['success' => true, 'subjects' => $subjects]);
?>
