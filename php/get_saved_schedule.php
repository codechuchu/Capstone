<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Database connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Get section_id from GET
$section_id = isset($_GET['section_id']) ? intval($_GET['section_id']) : 0;
if (!$section_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing or invalid section_id']);
    exit;
}

// Fetch saved schedules
$sql = "
    SELECT cs.*, s.name AS subject_name, CONCAT(t.firstname, ' ', t.lastname) AS teacher_name
    FROM class_schedules cs
    LEFT JOIN subjects s ON cs.subject_id = s.subject_id
    LEFT JOIN teachers t ON cs.teacher_id = t.teacher_id
    WHERE cs.section_id = ?
    ORDER BY cs.day_of_week, cs.time_start
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement', 'error' => $conn->error]);
    exit;
}

$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();

$schedules = [];
while ($row = $result->fetch_assoc()) {
    $schedules[] = [
        'day_of_week'   => $row['day_of_week'],
        'subject_id'    => intval($row['subject_id']),
        'subject_name'  => $row['subject_name'],
        'teacher_id'    => intval($row['teacher_id']),
        'teacher_name'  => $row['teacher_name'],
        'time_start'    => $row['time_start'],
        'time_end'      => $row['time_end']
    ];
}

echo json_encode(['status' => 'success', 'schedules' => $schedules]);

$stmt->close();
$conn->close();
?>
