<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Database connection (XAMPP)
$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// ✅ Ensure student is logged in
if (!isset($_SESSION['role'], $_SESSION['user_id']) || $_SESSION['role'] !== 'students') {
    echo json_encode(["success" => false, "message" => "Not logged in as student"]);
    exit();
}

$student_id = $_SESSION['user_id'];
$table = 'shs_applicant'; // Change this if other student tables exist
$doc_table = 'shs_applicant_documents'; // For document check

// ✅ Fetch student info
$stmt = $conn->prepare("
    SELECT applicant_id, firstname, lastname, grade_level, emailaddress AS email
    FROM $table
    WHERE applicant_id = ?
");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Student not found"]);
    exit();
}

$applicant = $result->fetch_assoc();

// ✅ Fetch documents info
$doc_stmt = $conn->prepare("
    SELECT birth_certificate, original_form_138, good_moral, original_form_137
    FROM $doc_table
    WHERE applicant_id = ?
");
$doc_stmt->bind_param("i", $student_id);
$doc_stmt->execute();
$doc_result = $doc_stmt->get_result();
$documents = $doc_result->num_rows > 0 ? $doc_result->fetch_assoc() : [
    "birth_certificate" => null,
    "original_form_138" => null,
    "good_moral" => null,
    "original_form_137" => null
];

echo json_encode([
    "success" => true,
    "firstname" => $applicant['firstname'],
    "lastname" => $applicant['lastname'],
    "email" => $applicant['email'],
    "grade_level" => $applicant['grade_level'],
    // ✅ Documents info
    "birth_certificate" => $documents['birth_certificate'],
    "original_form_138" => $documents['original_form_138'],
    "good_moral" => $documents['good_moral'],
    "original_form_137" => $documents['original_form_137']
]);

$stmt->close();
$doc_stmt->close();
$conn->close();
?>
