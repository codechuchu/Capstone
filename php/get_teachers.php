<?php
header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

$subject_id = intval($_GET['subject_id'] ?? 0);
$assigned_level = $_GET['assigned_level'] ?? 'Senior High'; 
$assigned_level = $conn->real_escape_string($assigned_level);

if ($subject_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid subject_id']);
    exit;
}

if (strtolower($assigned_level) === 'junior high') {
    $stmt = $conn->prepare("SELECT subject_name AS name FROM jhs_subjects WHERE subject_id = ?");
} else {
    $stmt = $conn->prepare("SELECT name FROM subjects WHERE subject_id = ?");
}

$stmt->bind_param("i", $subject_id);
$stmt->execute();
$res = $stmt->get_result();
$subject = $res->fetch_assoc();

if (!$subject) {
    echo json_encode(['status' => 'error', 'message' => 'Subject not found']);
    exit;
}

$subject_name = $subject['name'];

$sql = "SELECT teacher_id, firstname, lastname, subjects 
        FROM teachers 
        WHERE assigned_level = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $assigned_level);
$stmt->execute();
$result = $stmt->get_result();

$teachers = [];
while ($row = $result->fetch_assoc()) {
    $subjectsArray = array_map('trim', explode(',', $row['subjects'] ?? ''));
    foreach ($subjectsArray as $s) {
        if (strcasecmp($s, $subject_name) === 0) {
            $teachers[] = [
                'teacher_id' => $row['teacher_id'],
                'firstname' => $row['firstname'],
                'lastname' => $row['lastname']
            ];
            break;
        }
    }
}

echo json_encode(['status' => 'success', 'teachers' => $teachers]);
$conn->close();
exit;
?>
