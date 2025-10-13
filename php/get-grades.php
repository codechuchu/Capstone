<?php
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php-error.log');

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parents') {
    echo json_encode(["status" => "error", "message" => "Parent not logged in"]);
    exit;
}

$parentId = $_SESSION['user_id'];
$lrn = $_GET['lrn'] ?? '';
$level = $_GET['level'] ?? 'JHS';

if (empty($lrn)) {
    echo json_encode(["status" => "error", "message" => "LRN is required"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$lrn = $conn->real_escape_string(trim($lrn));
$grades = [];

if ($level === 'SHS') {
    $stmt = $conn->prepare("
        SELECT 
            sg.grade_id,
            sg.student_id,
            sg.section_id,
            sg.subject_id,
            s.name AS subject_name,
            sg.q1_grade,
            sg.q2_grade,
            sg.final_grade,
            sg.remarks,
            CONCAT(t.firstname, ' ', t.lastname) AS encoded_by
        FROM shs_studentgrade sg
        LEFT JOIN subjects s ON sg.subject_id = s.subject_id
        LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
        WHERE sg.student_id = (SELECT applicant_id FROM shs_applicant WHERE lrn = ?)
    ");
} else {
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
        $q1 = is_numeric($row['q1_grade']) ? (float)$row['q1_grade'] : null;
        $q2 = is_numeric($row['q2_grade']) ? (float)$row['q2_grade'] : null;
        $final = is_numeric($row['final_grade']) ? (float)$row['final_grade'] : null;

        // Only keep remarks if final_grade exists
        $remarks = $final !== null ? ($row['remarks'] ?? ($final >= 75 ? "Passed" : "Failed")) : null;

        $grades[] = [
            'grade_id' => $row['grade_id'],
            'student_id' => $row['student_id'],
            'section_id' => $row['section_id'],
            'subject_id' => $row['subject_id'],
            'subject_name' => $row['subject_name'] ?? 'N/A',
            'q1_grade' => $q1,
            'q2_grade' => $q2,
            'final_grade' => $final,
            'remarks' => $remarks,
            'encoded_by' => $row['encoded_by'] ?? 'N/A'
        ];
    } else {
        $grades[] = [
            'grade_id' => $row['grade_id'],
            'student_id' => $row['student_id'],
            'section_id' => $row['section_id'],
            'subject_id' => $row['subject_id'],
            'subject_name' => $row['subject_name'] ?? 'N/A',
            'q1' => is_numeric($row['q1']) ? (float)$row['q1'] : null,
            'q2' => is_numeric($row['q2']) ? (float)$row['q2'] : null,
            'q3' => is_numeric($row['q3']) ? (float)$row['q3'] : null,
            'q4' => is_numeric($row['q4']) ? (float)$row['q4'] : null,
            'average' => is_numeric($row['average']) ? (float)$row['average'] : null,
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
