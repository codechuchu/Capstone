<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Optional: filter by assigned_level
$assignedLevel = $_SESSION['assigned_level'] ?? '';
if ($assignedLevel) {
    $stmt = $conn->prepare("SELECT * FROM sections_list WHERE assigned_level = ? AND is_archived = 0 ORDER BY section_name ASC");
    $stmt->bind_param("s", $assignedLevel);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query("SELECT * FROM sections_list WHERE is_archived = 0 ORDER BY section_name ASC");
}

$sections = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Fetch adviser name(s)
        $adviserNames = [];
        if (!empty($row['adviser'])) {
            $adviserIds = explode(',', $row['adviser']);
            $placeholders = implode(',', array_fill(0, count($adviserIds), '?'));
            $stmt2 = $conn->prepare("SELECT firstname, middlename, lastname FROM teachers WHERE teacher_id IN ($placeholders)");
            $stmt2->bind_param(str_repeat('i', count($adviserIds)), ...$adviserIds);
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            while ($t = $res2->fetch_assoc()) {
                $adviserNames[] = $t['firstname'] . ' ' . $t['middlename'] . ' ' . $t['lastname'];
            }
        }
        $row['adviser_name'] = implode(', ', $adviserNames);
        $sections[] = $row;
    }
}

echo json_encode(["success" => true, "sections" => $sections]);

$conn->close();
