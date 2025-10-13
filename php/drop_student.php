<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

require_once "log_audit.php"; // ✅ Include your audit log function

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$student_id = intval($data['student_id'] ?? 0);
$reason = trim($data['reason'] ?? '');

if (!$student_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid student ID']);
    exit;
}

if ($reason === '') {
    echo json_encode(['success' => false, 'error' => 'Drop reason is required']);
    exit;
}

// ✅ Validate student exists
$stmt = $conn->prepare("SELECT applicant_id, section_id FROM shs_applicant WHERE applicant_id = ?");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();
$applicant = $result->fetch_assoc();
$stmt->close();

if (!$applicant) {
    echo json_encode(['success' => false, 'error' => 'Invalid student ID']);
    exit;
}

$applicant_id = $applicant['applicant_id'];
$section_id = $applicant['section_id'];

// ✅ Update student record
$update = $conn->prepare("UPDATE shs_applicant SET status='dropped', drop_reason=?, section_id=NULL WHERE applicant_id=?");
$update->bind_param("si", $reason, $applicant_id);

if ($update->execute()) {
    // ✅ Delete from section table
    $del = $conn->prepare("DELETE FROM section WHERE student_id=? AND section_id=?");
    $del->bind_param("ii", $applicant_id, $section_id);
    $del->execute();
    $del->close();

    // ✅ Recalculate total students
    if ($section_id) {
        $recalc = $conn->prepare("SELECT COUNT(*) AS total FROM shs_applicant WHERE section_id=? AND status='enrolled'");
        $recalc->bind_param("i", $section_id);
        $recalc->execute();
        $totalRes = $recalc->get_result()->fetch_assoc();
        $recalc->close();

        $updateTotal = $conn->prepare("UPDATE sections_list SET total_students=? WHERE section_id=?");
        $updateTotal->bind_param("ii", $totalRes['total'], $section_id);
        $updateTotal->execute();
        $updateTotal->close();
    }

    // ✅ Audit trail (safe — wrapped in try/catch)
    try {
        $user_id = $_SESSION['user_id'] ?? 0;
        $username = $_SESSION['email'] ?? 'unknown';
        $role = $_SESSION['role'] ?? 'unknown';
        $action = "Dropped Student";
        $details = "Dropped student ID: $student_id | Reason: $reason";

        logAction($conn, $user_id, $username, $role, $action, $details);
    } catch (Throwable $e) {
        // Silent catch to prevent breaking JSON response
    }

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $conn->error]);
}

$conn->close();
?>
