<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // hide errors in output
header('Content-Type: application/json');

session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB connection failed']);
    exit;
}

$firstname  = trim($_POST['teacher_firstname'] ?? '');
$middlename = trim($_POST['teacher_middlename'] ?? '');
$lastname   = trim($_POST['teacher_lastname'] ?? '');
$email      = trim($_POST['teacher_email'] ?? '');

// ✅ Use assigned_level from session
$assigned_level = strtolower($_SESSION['assigned_level'] ?? '');

$subjects   = $_POST['subjects'] ?? [];

if (empty($firstname) || empty($lastname) || empty($email) || empty($assigned_level)) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Missing required fields']);
    exit;
}

// Ensure subjects array
if (!is_array($subjects)) $subjects = [$subjects];

// Prepare password
$password_plain = strtolower($lastname) . '.123';

// Get subject names depending on level
$subject_ids = [];
$subject_names = [];

foreach ($subjects as $sub_id) {
    $sub_id = intval($sub_id);
    
    if ($assigned_level === 'junior high') {
        $res = $conn->query("SELECT subject_name AS name FROM jhs_subjects WHERE subject_id = $sub_id LIMIT 1");
    } else { // senior high
        $res = $conn->query("SELECT name FROM subjects WHERE subject_id = $sub_id LIMIT 1");
    }

    if ($row = $res->fetch_assoc()) {
        $subject_ids[] = $sub_id;
        $subject_names[] = $row['name'];
    }
}

// Convert arrays to strings
$subject_ids_str   = implode(',', $subject_ids);
$subject_names_str = implode(', ', $subject_names);

// Insert teacher
$stmt = $conn->prepare("INSERT INTO teachers (email, assigned_level, firstname, middlename, lastname, password, subject_id, subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Prepare failed']);
    exit;
}

$stmt->bind_param(
    "ssssssss",
    $email,
    $assigned_level,
    $firstname,
    $middlename,
    $lastname,
    $password_plain,
    $subject_ids_str,
    $subject_names_str
);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Teacher account created successfully!',
        'password' => $password_plain
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Execute failed']);
}

$stmt->close();
$conn->close();
?>
