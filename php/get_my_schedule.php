<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Use session to get student ID
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'students') {
    echo json_encode(['status'=>'error','message'=>'Not logged in as student']);
    exit;
}

$student_id = $_SESSION['user_id']; // <-- get student_id from session

// Get section ID
$sectionQuery = $conn->prepare("SELECT section_id FROM section WHERE student_id = ?");
$sectionQuery->bind_param("i", $student_id);
$sectionQuery->execute();
$sectionResult = $sectionQuery->get_result();

if ($sectionResult->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Section not found for this student']);
    exit;
}

$section = $sectionResult->fetch_assoc();
$section_id = $section['section_id'];

// Fetch all schedules
$sql = "
    SELECT cs.day_of_week, cs.time_start, cs.time_end, s.name AS subject_name,
           CONCAT(t.firstname, ' ', t.lastname) AS teacher_name
    FROM class_schedules cs
    JOIN subjects s ON cs.subject_id = s.subject_id
    JOIN teachers t ON cs.teacher_id = t.teacher_id
    WHERE cs.section_id = ?
    ORDER BY cs.time_start ASC, 
             FIELD(cs.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday')
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $section_id);
$stmt->execute();
$result = $stmt->get_result();

$schedules = [];
while ($row = $result->fetch_assoc()) {
    $schedules[] = [
        'day_of_week'  => $row['day_of_week'],
        'time_start'   => date("H:i", strtotime($row['time_start'])),
        'time_end'     => date("H:i", strtotime($row['time_end'])),
        'subject_name' => $row['subject_name'],
        'teacher_name' => $row['teacher_name']
    ];
}

echo json_encode(['status' => 'success', 'schedules' => $schedules]);

$stmt->close();
$conn->close();
?>
