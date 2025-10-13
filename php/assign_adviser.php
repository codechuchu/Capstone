<?php
session_start();
header('Content-Type: application/json');

include_once __DIR__ . '/log_audit.php'; // Make sure log_audit.php defines logAction($conn,...)

$input = json_decode(file_get_contents('php://input'), true);
$section_id = intval($input['section_id'] ?? 0);
$teacher_id = intval($input['teacher_id'] ?? 0);

if (!$section_id || !$teacher_id) {
    echo json_encode(["status" => "error", "message" => "Invalid section or teacher ID"]);
    exit();
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Update section with adviser
$stmt = $conn->prepare("UPDATE sections SET adviser_id = ? WHERE section_id = ?");
$stmt->bind_param("ii", $teacher_id, $section_id);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(["status" => "success", "message" => "Adviser assigned successfully"]);

    // Audit: log the assignment
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

} else {
    echo json_encode(["status" => "error", "message" => "Failed to assign adviser"]);

    // Optional: log failed attempt
    if (function_exists('logAction')) {
        $action = "Failed Adviser Assignment";
        $details = "Attempted Teacher ID: $teacher_id for Section ID: $section_id";
        logAction(
            $conn,
            $_SESSION['user_id'] ?? 0,
            $_SESSION['email'] ?? 'unknown',
            $_SESSION['role'] ?? 'unknown',
            $action,
            $details
        );
    }
}

$stmt->close();
$conn->close();
?>
