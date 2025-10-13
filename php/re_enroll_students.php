<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

require_once "log_audit.php"; // ✅ include your audit trail function

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Extract data
$old_section_id = intval($data['section_id'] ?? 0);
$students = $data['students'] ?? [];
$grade_level = intval($data['grade_level'] ?? 0);
$semester = intval($data['semester'] ?? 0);
$strand = $conn->real_escape_string($data['strand'] ?? '');
$new_section_name_input = $conn->real_escape_string($data['new_section_name'] ?? '');

if (!$old_section_id || !$grade_level || !$semester || !$strand || !$new_section_name_input || !is_array($students) || count($students) === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid request data']);
    exit;
}

// Determine assigned_level based on grade level
$assigned_level = ($grade_level >= 11 && $grade_level <= 12) ? 'Senior High' : 'Junior High';

// Build full section name
$full_section_name = $strand . ' ' . $grade_level . '-' . $new_section_name_input;

// Get strand_id
$strand_id_result = $conn->query("SELECT strand_id FROM strand WHERE strand = '$strand' LIMIT 1");
$strand_id = ($strand_id_result && $row = $strand_id_result->fetch_assoc()) ? $row['strand_id'] : null;

// Step 1: Create a new section
$sqlInsertSection = "INSERT INTO sections_list (section_name, grade_level, semester, strand, strand_id, assigned_level, total_students, is_archived) 
                     VALUES ('$full_section_name', $grade_level, $semester, '$strand', " . ($strand_id ?? 'NULL') . ", '$assigned_level', " . count($students) . ", 0)";
if (!$conn->query($sqlInsertSection)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create new section: ' . $conn->error]);
    exit;
}

$new_section_id = $conn->insert_id;

// Step 2: Get student IDs from old section
$studentNames = array_map(function($s) use ($conn) {
    return "'" . $conn->real_escape_string($s) . "'";
}, $students);

$studentList = implode(',', $studentNames);
$sql = "SELECT student_id, student_name FROM section WHERE section_id = $old_section_id AND student_name IN ($studentList)";
$result = $conn->query($sql);

$studentIds = [];
$studentMap = [];
while ($row = $result->fetch_assoc()) {
    $studentIds[] = $row['student_id'];
    $studentMap[$row['student_id']] = $row['student_name'];
}

if (count($studentIds) === 0) {
    echo json_encode(['success' => false, 'message' => 'No matching students found in the old section']);
    exit;
}

$idsString = implode(',', $studentIds);

// Step 3: Update SHS applicant table
$sqlUpdate = "UPDATE shs_applicant SET 
    status='enrolled', 
    grade_level = $grade_level, 
    semester = $semester, 
    strand = '$strand',
    section_id = $new_section_id
    WHERE applicant_id IN ($idsString)";

if (!$conn->query($sqlUpdate)) {
    echo json_encode(['success' => false, 'message' => 'Failed to update students: ' . $conn->error]);
    exit;
}

// Step 4: Insert students into new section
$values = [];
foreach ($studentIds as $sid) {
    $student_name = $conn->real_escape_string($studentMap[$sid] ?? '');
    $values[] = "($new_section_id, $sid, '$student_name', '$strand', $grade_level)";
}

if (count($values) > 0) {
    $sqlInsertStudents = "INSERT INTO section (section_id, student_id, student_name, strand, grade_level) VALUES " . implode(',', $values);
    $conn->query($sqlInsertStudents);
}

// Step 5: Update total_students
$conn->query("UPDATE sections_list SET total_students = (SELECT COUNT(*) FROM section WHERE section_id = $new_section_id) WHERE section_id = $new_section_id");

// ✅ Step 6: Audit trail
try {
    $user_id = $_SESSION['user_id'] ?? 0;
    $username = $_SESSION['email'] ?? 'unknown';
    $role = $_SESSION['role'] ?? 'unknown';
    $action = "Reassigned Students";
    $details = "Moved " . count($studentIds) . " student(s) from section ID $old_section_id to new section '$full_section_name' (ID: $new_section_id).";

    logAction($conn, $user_id, $username, $role, $action, $details);
} catch (Throwable $e) {
    // Ignore logging failure to prevent JSON break
}

echo json_encode(['success' => true, 'message' => "Selected students re-enrolled into section '$full_section_name'."]);

$conn->close();
?>
