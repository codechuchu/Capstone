<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$status = $_GET['status'] ?? 'inuse'; 
$assigned_level = $_SESSION['assigned_level'] ?? null;

$sql = "SELECT section_id, section_name, grade_level, total_students, assigned_level, adviser 
        FROM sections_list 
        WHERE 1=1";

if ($status === "archived") {
    $sql .= " AND is_archived = 1";
} elseif ($status === "unarchived") {
    $sql .= " AND is_archived = 2";
} else {
    $sql .= " AND is_archived = 0";
}

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
        $row['adviser_id'] = $row['adviser'] ?? '';
        // Add level field for JS: 'jhs' or 'shs'
        $row['level'] = (strtolower($row['assigned_level']) === 'junior high') ? 'jhs' : 'shs';
        $sections[] = $row;
    }
}

echo json_encode($sections);
$conn->close();
