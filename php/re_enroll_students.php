<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();

require_once "log_audit.php";

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$old_section_id = intval($data['section_id'] ?? 0);
$applicant_ids  = $data['students'] ?? [];
$grade_level    = intval($data['grade_level'] ?? 0);
$semester       = intval($data['semester'] ?? 0);
$strand         = trim($data['strand'] ?? '');
$new_section_name_input = trim($data['new_section_name'] ?? '');
$school_year    = trim($data['school_year'] ?? '');

$assigned_level = ($grade_level >= 11 && $grade_level <= 12) ? 'Senior High' : 'Junior High';

if (!$old_section_id || !$grade_level || !is_array($applicant_ids) || count($applicant_ids) === 0 || !$new_section_name_input || !$school_year) {
    echo json_encode(['success' => false, 'message' => 'Invalid request data']);
    exit;
}

$strandMap = [
    'STEM' => 1,
    'ABM' => 3,
    'HUMMS' => 4,
    'GAS' => 5,
    'TVL ICT' => 6,
    'TVL HE' => 7
];

$strand_id = 0;
if ($assigned_level === 'Senior High') {
    $strand_upper = strtoupper($strand);
    if (isset($strandMap[$strand_upper])) {
        $strand_id = $strandMap[$strand_upper];
    } else {
        echo json_encode(['success' => false, 'message' => "Invalid strand: $strand"]);
        exit;
    }
}

$studentTable = ($assigned_level === 'Junior High') ? 'jhs_applicants' : 'shs_applicant';
$pkField = 'applicant_id';

if ($assigned_level === 'Senior High') {
    $full_section_name = $strand_upper . ' ' . $grade_level . '-' . $new_section_name_input;
} else {
    $full_section_name = 'Grade ' . $grade_level . '-' . $new_section_name_input;
}

$idsString = implode(',', array_map('intval', $applicant_ids));
$sql = "SELECT $pkField, firstname, middlename, lastname FROM $studentTable WHERE $pkField IN ($idsString)";
$result = $conn->query($sql);

$studentIds = [];
$studentMap = [];
while ($row = $result->fetch_assoc()) {
    $studentIds[] = $row[$pkField];
    $studentMap[$row[$pkField]] = $row['firstname'] . ' ' . 
                                  ($row['middlename'] ? substr($row['middlename'], 0, 1) . '. ' : '') . 
                                  $row['lastname'];
}

if (count($studentIds) === 0) {
    echo json_encode(['success' => false, 'message' => 'No matching students found in the old section']);
    exit;
}

if ($assigned_level === 'Senior High') {
    $sqlInsertSection = "INSERT INTO sections_list 
        (section_name, grade_level, semester, strand, strand_id, assigned_level, total_students, is_archived, school_year) 
        VALUES ('$full_section_name', $grade_level, $semester, '$strand_upper', $strand_id, '$assigned_level', " . count($studentIds) . ", 0, '$school_year')";
} else {
    $sqlInsertSection = "INSERT INTO sections_list 
        (section_name, grade_level, semester, strand, strand_id, assigned_level, total_students, is_archived, school_year) 
        VALUES ('$full_section_name', $grade_level, 1, 'JHS', 1, '$assigned_level', " . count($studentIds) . ", 0, '$school_year')";
}

if (!$conn->query($sqlInsertSection)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create new section: ' . $conn->error]);
    exit;
}
$new_section_id = $conn->insert_id;

$idsString = implode(',', $studentIds);
$sqlUpdate = "UPDATE $studentTable SET 
    status='enrolled',
    grade_level=$grade_level,
    section_id=$new_section_id";

if ($assigned_level === 'Senior High') {
    $sqlUpdate .= ", semester=$semester, strand='$strand_upper'";
}

$sqlUpdate .= " WHERE $pkField IN ($idsString)";
if (!$conn->query($sqlUpdate)) {
    echo json_encode(['success' => false, 'message' => 'Failed to update students: ' . $conn->error]);
    exit;
}

$values = [];
foreach ($studentIds as $sid) {
    $name = $conn->real_escape_string($studentMap[$sid]);
    if ($assigned_level === 'Senior High') {
        $values[] = "($new_section_id, $sid, '$name', '$strand_upper', $grade_level)";
    } else {
        $values[] = "($new_section_id, $sid, '$name', 'JHS', $grade_level)";
    }
}
if (count($values) > 0) {
    $sqlInsertStudents = "INSERT INTO section (section_id, student_id, student_name, strand, grade_level) VALUES " . implode(',', $values);
    $conn->query($sqlInsertStudents);
}

$conn->query("UPDATE sections_list SET total_students = (SELECT COUNT(*) FROM section WHERE section_id = $new_section_id) WHERE section_id = $new_section_id");

try {
    $user_id = $_SESSION['user_id'] ?? 0;
    $username = $_SESSION['email'] ?? 'unknown';
    $role = $_SESSION['role'] ?? 'unknown';
    $action = "Reassigned Students";
    $details = "Moved " . count($studentIds) . " student(s) from section ID $old_section_id to new section '$full_section_name' (ID: $new_section_id).";
    logAction($conn, $user_id, $username, $role, $action, $details);
} catch (Throwable $e) {}

echo json_encode(['success' => true, 'message' => "Selected students re-enrolled into section '$full_section_name'."]);
$conn->close();
?>
