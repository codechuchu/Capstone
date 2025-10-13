<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

$firstname  = trim($_POST['teacher_firstname'] ?? '');
$middlename = trim($_POST['teacher_middlename'] ?? '');
$lastname   = trim($_POST['teacher_lastname'] ?? '');
$email      = trim($_POST['teacher_email'] ?? '');
$assigned_level = strtolower($_SESSION['assigned_level'] ?? '');
$subjects   = $_POST['subjects'] ?? [];

if (empty($firstname) || empty($lastname) || empty($email) || empty($assigned_level)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

if (!is_array($subjects)) $subjects = [$subjects];
$password_plain = strtolower($lastname) . '.123';

$subject_ids = [];
$subject_names = [];

foreach ($subjects as $sub_id) {
    $sub_id = intval($sub_id);
    if ($assigned_level === 'junior high') {
        $res = $conn->query("SELECT subject_name AS name FROM jhs_subjects WHERE subject_id = $sub_id LIMIT 1");
    } else {
        $res = $conn->query("SELECT name FROM subjects WHERE subject_id = $sub_id LIMIT 1");
    }
    if ($row = $res->fetch_assoc()) {
        $subject_ids[] = $sub_id;
        $subject_names[] = $row['name'];
    }
}

$subject_ids_str   = implode(',', $subject_ids);
$subject_names_str = implode(', ', $subject_names);

$stmt = $conn->prepare("
    INSERT INTO teachers (email, assigned_level, firstname, middlename, lastname, password, subject_id, subjects)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("ssssssss", $email, $assigned_level, $firstname, $middlename, $lastname, $password_plain, $subject_ids_str, $subject_names_str);

if ($stmt->execute()) {
    if (isset($_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'])) {
        $user_id  = $_SESSION['user_id'];
        $username = $_SESSION['email'];
        $role     = $_SESSION['role'];
        $action   = "Add Teacher";
        $details  = "Added teacher account for $firstname $lastname ($email)";
        $ip       = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

        $stmtAudit = $conn->prepare("
            INSERT INTO audit_trail (user_id, username, role, action, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmtAudit->bind_param("isssss", $user_id, $username, $role, $action, $details, $ip);
        $stmtAudit->execute();
        $stmtAudit->close();
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Teacher account created successfully!',
        'password' => $password_plain
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Execute failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
