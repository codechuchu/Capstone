<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

if (!isset($_SESSION['role'], $_SESSION['user_id']) || $_SESSION['role'] !== 'students') {
    echo json_encode(["success" => false, "message" => "Not logged in as student"]);
    exit();
}

$student_id = $_SESSION['user_id'];

// Check which applicant table to use by seeing if student exists in SHS first, then JHS
$appTable = "";
$stmtCheck = $conn->prepare("SELECT applicant_id, firstname, lastname, grade_level, emailaddress AS email FROM shs_applicant WHERE applicant_id = ?");
$stmtCheck->bind_param("i", $student_id);
$stmtCheck->execute();
$resCheck = $stmtCheck->get_result();

if ($resCheck->num_rows > 0) {
    $appTable = "shs_applicant";
} else {
    // Check JHS
    $stmtCheck = $conn->prepare("SELECT applicant_id, firstname, lastname, grade_level, emailaddress AS email FROM jhs_applicants WHERE applicant_id = ?");
    $stmtCheck->bind_param("i", $student_id);
    $stmtCheck->execute();
    $resCheck = $stmtCheck->get_result();
    if ($resCheck->num_rows > 0) {
        $appTable = "jhs_applicants";
    } else {
        echo json_encode(["success" => false, "message" => "Student info not found"]);
        exit();
    }
}

$applicant = $resCheck->fetch_assoc();

echo json_encode([
    "success" => true,
    "firstname" => $applicant['firstname'],
    "lastname" => $applicant['lastname'],
    "email" => $applicant['email'],
    "grade_level" => $applicant['grade_level']
]);

$stmtCheck->close();
$conn->close();
