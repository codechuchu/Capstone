<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teachers') {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as teacher']);
    exit;
}

$teacher_id = $_SESSION['user_id'];

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Fetch distinct sections + subjects for this teacher
$sql = "SELECT DISTINCT sl.section_id, sl.section_name, s.name AS subject_name, cs.subject_id
        FROM sections_list sl
        INNER JOIN class_schedules cs ON cs.section_id = sl.section_id
        INNER JOIN subjects s ON s.subject_id = cs.subject_id
        WHERE cs.teacher_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();

$sections = [];
$seen = []; // prevent duplicates even if DISTINCT fails

while ($row = $result->fetch_assoc()) {
    $key = $row['section_id'] . '-' . $row['subject_id'];
    if (!isset($seen[$key])) {
        $sections[] = [
            'section_id'    => $row['section_id'],
            'section_name'  => $row['section_name'],
            'subject_name'  => $row['subject_name'],
            'subject_id'    => $row['subject_id']
        ];
        $seen[$key] = true;
    }
}

echo json_encode($sections);

$stmt->close();
$conn->close();
?>
