<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parents') {
    echo json_encode(["status" => "error", "message" => "Parent not logged in"]);
    exit;
}

if (!isset($_GET['lrn'])) {
    echo json_encode(["status" => "error", "message" => "LRN not provided"]);
    exit;
}

$lrn = $_GET['lrn'];

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// First: get student_id from JHS or SHS applicants
$student_id = null;
$stmt = $conn->prepare("SELECT applicant_id FROM jhs_applicants WHERE lrn = ? LIMIT 1");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) $student_id = $row['applicant_id'];
$stmt->close();

if (!$student_id) {
    $stmt = $conn->prepare("SELECT applicant_id FROM shs_applicant WHERE lrn = ? LIMIT 1");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) $student_id = $row['applicant_id'];
    $stmt->close();
}

if (!$student_id) {
    echo json_encode(["status" => "error", "message" => "Student not found"]);
    exit;
}

// Find section_id from section table
$stmt = $conn->prepare("SELECT section_id FROM section WHERE student_id = ?");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    $section_id = $row['section_id'];
} else {
    echo json_encode(["status" => "error", "message" => "Section not found"]);
    exit;
}
$stmt->close();

// Fetch full schedule for that section (all days)
$stmt = $conn->prepare("
    SELECT cs.subject_id, cs.teacher_id, cs.day_of_week, cs.time_start, cs.time_end,
           s.name AS subject_name,
           t.firstname AS teacher_firstname, t.lastname AS teacher_lastname
    FROM class_schedules cs
    JOIN subjects s ON cs.subject_id = s.subject_id
    JOIN teachers t ON cs.teacher_id = t.teacher_id
    WHERE cs.section_id = ?
    ORDER BY 
        FIELD(cs.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
        cs.time_start ASC
");
$stmt->bind_param("i", $section_id);
$stmt->execute();
$res = $stmt->get_result();

$schedules = [];
while ($row = $res->fetch_assoc()) {
    $schedules[] = [
        "day_of_week" => $row['day_of_week'],
        "subject_name" => $row['subject_name'],
        "teacher_name" => $row['teacher_firstname'] . ' ' . $row['teacher_lastname'],
        "time_start" => $row['time_start'],
        "time_end" => $row['time_end']
    ];
}

echo json_encode(["status" => "success", "schedules" => $schedules]);
$conn->close();
?>
