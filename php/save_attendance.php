<?php
header('Content-Type: application/json');
session_start();

// -----------------------
// Session check
// -----------------------
if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'teachers') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$teacher_id = intval($_SESSION['user_id']);

// -----------------------
// Get input JSON
// -----------------------
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['section_id'], $data['attendance']) || !is_array($data['attendance'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
    exit;
}

$section_id = intval($data['section_id']);
$attendance = $data['attendance'];

// -----------------------
// DB connection
// -----------------------
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}
$conn->set_charset("utf8mb4");

try {
    // -----------------------
    // Get subject_id for section
    // -----------------------
    $stmt = $conn->prepare("
        SELECT s.subject_id 
        FROM subjects s
        JOIN sections_list sl ON s.strand_id = sl.strand_id
        WHERE sl.section_id = ? LIMIT 1
    ");
    $stmt->bind_param("i", $section_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $subject = $result->fetch_assoc();
    $stmt->close();

    if (!$subject) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'No subject found for this section']);
        exit;
    }

    $subject_id = intval($subject['subject_id']);

    // -----------------------
    // Prepare insert/update statement
    // -----------------------
    $stmt = $conn->prepare("
        INSERT INTO attendance (student_id, section_id, teacher_id, subject_id, attendance_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            teacher_id = VALUES(teacher_id),
            subject_id = VALUES(subject_id)
    ");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

    $conn->begin_transaction();

    foreach ($attendance as $record) {
        if (!isset($record['student_id'], $record['date'], $record['present'])) continue;

        $student_id = intval($record['student_id']);
        $date = $record['date'];
        $state = intval($record['present']);

        // Only save if ✓ (1) or X (2)
        if ($state !== 1 && $state !== 2) continue;

        // Verify student belongs to this section
        $checkStmt = $conn->prepare("SELECT 1 FROM shs_applicant WHERE applicant_id = ? AND section_id = ? LIMIT 1");
        $checkStmt->bind_param("ii", $student_id, $section_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $exists = $checkResult->fetch_assoc();
        $checkStmt->close();
        if (!$exists) continue;

        $stmt->bind_param("iiiisi", $student_id, $section_id, $teacher_id, $subject_id, $date, $state);
        $stmt->execute();
    }

    $conn->commit();
    $stmt->close();
    $conn->close();

    echo json_encode(['status' => 'success', 'message' => 'Attendance saved successfully.']);

} catch (Exception $e) {
    $conn->rollback();
    $conn->close();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
