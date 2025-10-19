<?php
header('Content-Type: application/json');
$conn = new mysqli("localhost", "root", "", "sulivannhs");

if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

$assigned_level = $_GET['assigned_level'] ?? 'Senior High'; // default SHS
$assigned_level = strtolower($assigned_level);

$subjects = [];

if ($assigned_level === "senior high") {
    $sql = "SELECT subject_id, subcode, name FROM subjects ORDER BY subcode ASC";
    $result = $conn->query($sql);

    while ($row = $result->fetch_assoc()) {
        $subjects[] = $row;
    }
} elseif ($assigned_level === "junior high") {
    $sql = "SELECT subject_id, subject_name FROM jhs_subjects ORDER BY subject_name ASC";
    $result = $conn->query($sql);

    while ($row = $result->fetch_assoc()) {
        $subjects[] = [
            'subject_id' => $row['subject_id'], // updated column name
            'subcode' => '',                     // JHS doesn’t have subcode
            'name' => $row['subject_name']
        ];
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid assigned level']);
    exit;
}

echo json_encode(['status' => 'success', 'subjects' => $subjects]);
exit;
?>