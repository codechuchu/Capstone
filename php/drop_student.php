<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$student_id = intval($data['student_id']);
$reason = trim($data['reason'] ?? '');

if (!$student_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid student ID']);
    exit;
}

if ($reason === '') {
    echo json_encode(['success' => false, 'error' => 'Drop reason is required']);
    exit;
}

// Validate student exists in shs_applicant
$stmt = $conn->prepare("SELECT applicant_id, section_id FROM shs_applicant WHERE applicant_id = ?");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();
$applicant = $result->fetch_assoc();

if (!$applicant) {
    echo json_encode(['success' => false, 'error' => 'Invalid student ID']);
    exit;
}

$applicant_id = $applicant['applicant_id'];
$section_id = $applicant['section_id'];

// Update status and drop_reason
$update = $conn->prepare("UPDATE shs_applicant SET status='dropped', drop_reason=?, section_id=NULL WHERE applicant_id=?");
$update->bind_param("si", $reason, $applicant_id);

if ($update->execute()) {
    // Delete from section table
    $del = $conn->prepare("DELETE FROM section WHERE student_id=? AND section_id=?");
    $del->bind_param("ii", $applicant_id, $section_id);
    $del->execute();

    // Recalculate total_students
    if ($section_id) {
        $recalc = $conn->prepare("SELECT COUNT(*) AS total FROM shs_applicant WHERE section_id=? AND status='enrolled'");
        $recalc->bind_param("i", $section_id);
        $recalc->execute();
        $totalRes = $recalc->get_result()->fetch_assoc();

        $updateTotal = $conn->prepare("UPDATE sections_list SET total_students=? WHERE section_id=?");
        $updateTotal->bind_param("ii", $totalRes['total'], $section_id);
        $updateTotal->execute();
    }

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $conn->error]);
}

$conn->close();
?>
