<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$section_id = $data['section_id'] ?? null;

if (!$section_id) {
    echo json_encode(['error' => 'Missing section_id']);
    exit;
}

try {
    // Check which table has the section
    $table = null;
    $checkShs = $conn->prepare("SELECT 1 FROM shs_applicant WHERE section_id = ? LIMIT 1");
    $checkShs->bind_param("i", $section_id);
    $checkShs->execute();
    $checkShs->store_result();

    if ($checkShs->num_rows > 0) {
        $table = "shs_applicant";
    } else {
        $checkJhs = $conn->prepare("SELECT 1 FROM jhs_applicants WHERE section_id = ? LIMIT 1");
        $checkJhs->bind_param("i", $section_id);
        $checkJhs->execute();
        $checkJhs->store_result();
        if ($checkJhs->num_rows > 0) {
            $table = "jhs_applicants";
        }
    }

    if (!$table) {
        echo json_encode(['error' => 'No matching section found in SHS or JHS applicants.']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT 
            applicant_id AS student_id,
            lrn,
            firstname,
            middlename,
            lastname,
            gender
        FROM $table
        WHERE section_id = ?
        ORDER BY lastname ASC, firstname ASC
    ");
    $stmt->bind_param("i", $section_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = [
            'student_id' => $row['student_id'],
            'lrn' => $row['lrn'] ?? '',
            'firstname' => $row['firstname'] ?? '',
            'middlename' => $row['middlename'] ?? '',
            'lastname' => $row['lastname'] ?? '',
            'gender' => $row['gender'] ?? '',
            'student_name' => trim($row['lastname'] . ', ' . $row['firstname'] . ' ' . ($row['middlename'] ?? ''))
        ];
    }

    if (empty($students)) {
        echo json_encode(['error' => 'No students found for this section.']);
        exit;
    }

    echo json_encode(['students' => $students]);

} catch (Exception $e) {
    echo json_encode(['error' => 'Query error: ' . $e->getMessage()]);
}
?>
