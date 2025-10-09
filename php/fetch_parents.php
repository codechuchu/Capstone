<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Fetch parents
$sql = "SELECT email, password, student_id, firstname, lastname, lrn FROM parents";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    exit;
}

$parents = [];

while ($row = $result->fetch_assoc()) {
    $student_id = $row['student_id'];
    $student_name = null;

    // Try to find student in SHS applicants
    $stmt = $conn->prepare("SELECT firstname, lastname FROM shs_applicant WHERE applicant_id = ?");
    $stmt->bind_param("s", $student_id);
    $stmt->execute();
    $shs_result = $stmt->get_result();

    if ($shs_result->num_rows > 0) {
        $student = $shs_result->fetch_assoc();
        $student_name = $student['firstname'] . ' ' . $student['lastname'];
    } else {
        // Try JHS applicants
        $stmt = $conn->prepare("SELECT firstname, lastname FROM jhs_applicants WHERE applicant_id = ?");
        $stmt->bind_param("s", $student_id);
        $stmt->execute();
        $jhs_result = $stmt->get_result();

        if ($jhs_result->num_rows > 0) {
            $student = $jhs_result->fetch_assoc();
            $student_name = $student['firstname'] . ' ' . $student['lastname'];
        }
    }

    $stmt->close();

    $parents[] = [
        'email' => $row['email'],
        'password' => $row['password'],
        'student' => $student_name ?? 'N/A',
        'firstname' => $row['firstname'],
        'lastname' => $row['lastname'],
        'lrn' => $row['lrn']
    ];
}

echo json_encode(['success' => true, 'parents' => $parents]);
$conn->close();
?>
