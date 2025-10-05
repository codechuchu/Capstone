<?php
header('Content-Type: application/json');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

$subject_id = $_GET['subject_id'] ?? '';
$subject_id = intval($subject_id);

if ($subject_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid subject_id']);
    exit;
}

// Get the subject name from subjects table
$stmt = $conn->prepare("SELECT name FROM subjects WHERE subject_id = ?");
$stmt->bind_param("i", $subject_id);
$stmt->execute();
$res = $stmt->get_result();
$subject = $res->fetch_assoc();

if (!$subject) {
    echo json_encode(['status' => 'error', 'message' => 'Subject not found']);
    exit;
}

$subject_name = $subject['name'];

// Now find teachers who teach this subject
$sql = "SELECT teacher_id, firstname, lastname, subjects FROM teachers";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Query failed: ' . $conn->error]);
    exit;
}

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
