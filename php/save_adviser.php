<?php
session_start();
header('Content-Type: application/json');

include_once __DIR__ . '/log_audit.php'; // Ensure logAction() exists

$section_id = $_POST['section_id'] ?? null;
$teacher_id = $_POST['teacher_id'] ?? null;

if (!$section_id || !$teacher_id) {
    echo json_encode(['success' => false, 'message' => 'Missing section or teacher ID']);
    exit;
}

$host = "localhost";
$db = "sulivannhs";
$user = "root";
$pass = "";
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$success = false;

// 1. Update sections_list.adviser
$stmt = $conn->prepare("UPDATE sections_list SET adviser = ? WHERE section_id = ?");
$stmt->bind_param("ii", $teacher_id, $section_id);
if ($stmt->execute()) {
    $success = true;
}
$stmt->close();

// 2. Update teachers.advisory_class (append the section if multiple)
$stmt = $conn->prepare("SELECT advisory_class FROM teachers WHERE teacher_id = ?");
$stmt->bind_param("i", $teacher_id);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$currentClasses = $result['advisory_class'] ?? '';
$newClasses = $currentClasses ? $currentClasses . "," . $section_id : $section_id;
$stmt->close();

$stmt = $conn->prepare("UPDATE teachers SET advisory_class = ? WHERE teacher_id = ?");
$stmt->bind_param("si", $newClasses, $teacher_id);
if ($stmt->execute()) {
    $success = $success && true;
}
$stmt->close();

// ✅ Audit logging
if (function_exists('logAction')) {
    $action = "Assigned Adviser";
    $details = "Teacher ID: $teacher_id assigned to Section ID: $section_id";
    logAction(
        $conn,
        $_SESSION['user_id'] ?? 0,
        $_SESSION['email'] ?? 'unknown',
        $_SESSION['role'] ?? 'unknown',
        $action,
        $details
    );
}

$conn->close();

echo json_encode([
    'success' => $success,
    'message' => $success ? 'Adviser assigned successfully' : 'Failed to assign adviser'
]);
?>
