<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$section_id = $input['section_id'] ?? null;

if (!$section_id) {
    echo json_encode(['status'=>'error','message'=>'Section ID is required']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status'=>'error','message'=>'Database connection failed']);
    exit;
}

$stmt = $conn->prepare("
    SELECT cs.day_of_week, cs.time_start, cs.time_end, s.name AS subject_name,
           CONCAT(t.firstname, ' ', t.lastname) AS teacher_name
    FROM class_schedules cs
    JOIN subjects s ON cs.subject_id = s.subject_id
    JOIN teachers t ON cs.teacher_id = t.teacher_id
    WHERE cs.section_id = ?
    ORDER BY cs.time_start ASC, FIELD(cs.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday')
");
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

echo json_encode(['status'=>'success','schedules'=>$schedules]);
$stmt->close();
$conn->close();
?>
