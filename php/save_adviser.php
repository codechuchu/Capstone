<?php
session_start();
header('Content-Type: application/json');

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

// 1. Update sections_list.adviser
$stmt = $conn->prepare("UPDATE sections_list SET adviser = ? WHERE section_id = ?");
$stmt->bind_param("ii", $teacher_id, $section_id);
$stmt->execute();
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
$stmt->execute();
$stmt->close();

$conn->close();

echo json_encode(['success' => true, 'message' => 'Adviser assigned successfully']);
?>
