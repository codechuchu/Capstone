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

echo json_encode([
    "success" => true,
    "firstname" => $applicant['firstname'],
    "lastname" => $applicant['lastname'],
    "email" => $applicant['email'],
    "grade_level" => $applicant['grade_level']
]);

$stmt->close();
$conn->close();
?>
