<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parents') {
    echo json_encode(["status" => "error", "message" => "Parent not logged in"]);
    exit;
}

$parentId = $_SESSION['user_id'];
$lrn = $_GET['lrn'] ?? '';
$level = $_GET['level'] ?? 'JHS'; // default to JHS if not provided

if (empty($lrn)) {
    echo json_encode(["status" => "error", "message" => "LRN is required"]);
    exit;
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$lrn = $conn->real_escape_string(trim($lrn));
$grades = [];

if ($level === 'SHS') {
    // SHS grades query
    $stmt = $conn->prepare("
        SELECT 
            sg.grade_id,
            sg.student_id,
            sg.section_id,
            sg.subject_id,
            s.name AS subject_name,
            sg.first_sem_q1,
            sg.first_sem_q2,
            sg.first_sem_avg,
            sg.second_sem_q3,
            sg.second_sem_q4,
            sg.second_sem_avg,
            CONCAT(t.firstname, ' ', t.lastname) AS encoded_by
        FROM shs_studentgrade sg
        LEFT JOIN subjects s ON sg.subject_id = s.subject_id
        LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
        WHERE sg.student_id = (SELECT applicant_id FROM shs_applicant WHERE lrn = ?)
    ");
} else {
    // JHS grades query
    $stmt = $conn->prepare("
        SELECT 
            sg.grade_id,
            sg.student_id,
            sg.section_id,
            sg.subject_id,
            s.name AS subject_name,
            sg.q1,
            sg.q2,
            sg.q3,
            sg.q4,
            sg.average,
            CONCAT(t.firstname, ' ', t.lastname) AS teacher_name
        FROM studentgrade sg
        LEFT JOIN subjects s ON sg.subject_id = s.subject_id
        LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
        WHERE sg.student_id = (SELECT applicant_id FROM jhs_applicants WHERE lrn = ?)
    ");
}

$stmt->bind_param("s", $lrn);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    if ($level === 'SHS') {
        $grades[] = [
            'grade_id' => $row['grade_id'],
            'student_id' => $row['student_id'],
            'section_id' => $row['section_id'],
            'subject_id' => $row['subject_id'],
            'subject_name' => $row['subject_name'] ?? 'N/A',
            'first_sem_q1' => $row['first_sem_q1'],
            'first_sem_q2' => $row['first_sem_q2'],
            'first_sem_avg' => $row['first_sem_avg'],
            'second_sem_q3' => $row['second_sem_q3'],
            'second_sem_q4' => $row['second_sem_q4'],
            'second_sem_avg' => $row['second_sem_avg'],
            'encoded_by' => $row['encoded_by'] ?? 'N/A'
        ];
    } else {
        $grades[] = [
            'grade_id' => $row['grade_id'],
            'student_id' => $row['student_id'],
            'section_id' => $row['section_id'],
            'subject_id' => $row['subject_id'],
            'subject_name' => $row['subject_name'] ?? 'N/A',
            'q1' => $row['q1'],
            'q2' => $row['q2'],
            'q3' => $row['q3'],
            'q4' => $row['q4'],
            'average' => $row['average'],
            'teacher_name' => $row['teacher_name'] ?? 'N/A'
        ];
    }
}

echo json_encode([
    "status" => "success",
    "grades" => $grades
]);

$stmt->close();
$conn->close();
?>
