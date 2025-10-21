<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

session_start();
require_once "log_audit.php";

try {
    $servername = "localhost";
    $username   = "root";
    $password   = "";
    $dbname     = "sulivannhs";

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) throw new Exception('Database connection failed: ' . $conn->connect_error);

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) throw new Exception('Invalid JSON input');

    $applicant_ids  = $data['students'] ?? [];
    $grade_level    = intval($data['grade_level'] ?? 0);
    $semester       = intval($data['semester'] ?? 0);
    $strand         = trim($data['strand'] ?? '');
    $new_section_name_input = trim($data['new_section_name'] ?? '');
    $school_year    = trim($data['school_year'] ?? '');

    if (!$grade_level || !is_array($applicant_ids) || count($applicant_ids) === 0 || !$new_section_name_input || !$school_year) {
        throw new Exception('Invalid request data');
    }

    $assigned_level = ($grade_level >= 11 && $grade_level <= 12) ? 'Senior High' : 'Junior High';

    $strandMap = [
        'STEM' => 1,
        'ABM' => 3,
        'HUMMS' => 4,
        'GAS' => 5,
        'TVL ICT' => 6,
        'TVL HE' => 7
    ];

    $strand_id = 0;
    $strand_upper = '';
    if ($assigned_level === 'Senior High') {
        $strand_upper = strtoupper($strand);
        if (isset($strandMap[$strand_upper])) $strand_id = $strandMap[$strand_upper];
        else throw new Exception("Invalid strand: $strand");
    }

    $studentTable = ($assigned_level === 'Junior High') ? 'jhs_applicants' : 'shs_applicant';
    $pkField      = 'applicant_id';

    $full_section_name = ($assigned_level === 'Senior High')
        ? $strand_upper . ' ' . $grade_level . '-' . $new_section_name_input
        : 'Grade ' . $grade_level . '-' . $new_section_name_input;

    // ------------------- Fetch student IDs from archived_students -------------------
    $idsString = implode(',', array_map('intval', $applicant_ids));
    $sql = "SELECT applicant_id FROM archived_students WHERE applicant_id IN ($idsString)";
    $result = $conn->query($sql);

    $studentIds = [];
    while ($row = $result->fetch_assoc()) $studentIds[] = $row['applicant_id'];

    if (count($studentIds) === 0) {
        echo json_encode(['success' => false, 'console' => 'No matching students found in the archived section']);
        exit;
    }

    // ------------------- Fetch full student info -------------------
    $idsString = implode(',', $studentIds);
    $sql = "SELECT $pkField, firstname, middlename, lastname FROM $studentTable WHERE $pkField IN ($idsString)";
    $result = $conn->query($sql);
    $studentMap = [];
    while ($row = $result->fetch_assoc()) {
        $studentMap[$row[$pkField]] = $row['firstname'] . ' ' .
                                      ($row['middlename'] ? substr($row['middlename'], 0, 1) . '. ' : '') .
                                      $row['lastname'];
    }

    // ------------------- Insert new section -------------------
    $sqlInsertSection = ($assigned_level === 'Senior High')
        ? "INSERT INTO sections_list (section_name, grade_level, semester, strand, strand_id, assigned_level, total_students, is_archived, school_year)
           VALUES ('$full_section_name', $grade_level, $semester, '$strand_upper', $strand_id, '$assigned_level', " . count($studentIds) . ", 0, '$school_year')"
        : "INSERT INTO sections_list (section_name, grade_level, semester, strand, strand_id, assigned_level, total_students, is_archived, school_year)
           VALUES ('$full_section_name', $grade_level, 1, 'JHS', 1, '$assigned_level', " . count($studentIds) . ", 0, '$school_year')";

    if (!$conn->query($sqlInsertSection)) throw new Exception('Failed to create new section: ' . $conn->error);
    $new_section_id = $conn->insert_id;

    // ------------------- Update student status and assign to new section -------------------
    $sqlUpdate = "UPDATE $studentTable SET status='enrolled', grade_level=$grade_level, section_id=$new_section_id";
    if ($assigned_level === 'Senior High') $sqlUpdate .= ", semester=$semester, strand='$strand_upper'";
    $sqlUpdate .= " WHERE $pkField IN ($idsString)";
    if (!$conn->query($sqlUpdate)) throw new Exception('Failed to update students: ' . $conn->error);

    // ------------------- Insert into section table -------------------
    $values = [];
    foreach ($studentIds as $sid) {
        $name = $conn->real_escape_string($studentMap[$sid]);
        $values[] = "($new_section_id, $sid, '$name', '" . ($assigned_level === 'Senior High' ? $strand_upper : 'JHS') . "', $grade_level)";
    }
    if (count($values) > 0) {
        $sqlInsertStudents = "INSERT INTO section (section_id, student_id, student_name, strand, grade_level) VALUES " . implode(',', $values);
        $conn->query($sqlInsertStudents);
    }

    $conn->query("UPDATE sections_list SET total_students = (SELECT COUNT(*) FROM section WHERE section_id = $new_section_id) WHERE section_id = $new_section_id");

    // ------------------- Log audit -------------------
    try {
        $user_id = $_SESSION['user_id'] ?? 0;
        $username = $_SESSION['email'] ?? 'unknown';
        $role = $_SESSION['role'] ?? 'unknown';
        $action = "Reassigned Students";
        $details = "Moved " . count($studentIds) . " student(s) to new section '$full_section_name' (ID: $new_section_id).";
        logAction($conn, $user_id, $username, $role, $action, $details);
    } catch (Throwable $e) {}

    echo json_encode(['success' => true, 'message' => "Selected students re-enrolled into section '$full_section_name'."]);
    $conn->close();

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
