<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

// Default filter
$status = $_GET['status'] ?? 'inuse'; 
$assigned_level = $_SESSION['assigned_level'] ?? null;

// Base query
$sql = "SELECT section_id, section_name, grade_level, total_students, assigned_level, adviser 
        FROM sections_list 
        WHERE 1=1";

// Status filter
if ($status === "archived") {
    $sql .= " AND is_archived = 1";
} elseif ($status === "unarchived") {
    $sql .= " AND is_archived = 2";
} else { // in use
    $sql .= " AND is_archived = 0";
}

// Assigned level filter
if ($assigned_level === "Senior High") {
    $sql .= " AND assigned_level = 'Senior High'";
} elseif ($assigned_level === "Junior High") {
    $sql .= " AND assigned_level = 'Junior High'";
}

$sql .= " ORDER BY section_name ASC";

$result = $conn->query($sql);

$sections = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // Add adviser_id for JS
        $row['adviser_id'] = $row['adviser'] ?? ''; // assumes `adviser` column stores teacher_id
        $sections[] = $row;
    }
}

echo json_encode($sections);
$conn->close();
