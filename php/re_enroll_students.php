<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$section_id = intval($data['section_id']);
$students = $data['students'] ?? [];
$grade_level = intval($data['grade_level'] ?? 0);
$semester = intval($data['semester'] ?? 0);
$strand = $conn->real_escape_string($data['strand'] ?? '');

if (!$section_id || !is_array($students) || count($students) === 0 || !$grade_level || !$semester || !$strand) {
    echo json_encode(['success' => false, 'message' => 'Invalid request data']);
    exit;
}

// Sanitize student names
$students = array_map(function($s) use ($conn) {
    return $conn->real_escape_string($s);
}, $students);

$studentList = "'" . implode("','", $students) . "'";

// Step 1: Get student_ids
$sql = "SELECT student_id FROM section WHERE section_id = $section_id AND student_name IN ($studentList)";
$result = $conn->query($sql);

$studentIds = [];
while ($row = $result->fetch_assoc()) {
    $studentIds[] = $row['student_id'];
}

if (count($studentIds) === 0) {
    echo json_encode(['success' => false, 'message' => 'No matching students found']);
    exit;
}

$idsString = implode(',', $studentIds);

// Step 2: Update shs_applicant
$sqlUpdate = "UPDATE shs_applicant SET 
    status='enrolled', 
    grade_level = $grade_level, 
    semester = $semester, 
    strand = '$strand',
    section_id = NULL
    WHERE applicant_id IN ($idsString)";

if ($conn->query($sqlUpdate)) {
    // Step 3: Delete students from section table
    $sqlDelete = "DELETE FROM section WHERE section_id = $section_id AND student_id IN ($idsString)";
    $conn->query($sqlDelete);

    echo json_encode(['success' => true, 'message' => 'Selected students re-enrolled and removed from section.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update students: ' . $conn->error]);
}

$conn->close();
?>
