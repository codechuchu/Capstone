<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teachers') {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as teacher']);
    exit;
}

$teacher_id = $_SESSION['user_id'];

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
$applicant_id = isset($input['applicant_id']) ? intval($input['applicant_id']) : 0;
if (!$applicant_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing applicant_id']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

// Try SHS first
$sql = "SELECT * FROM shs_applicant WHERE applicant_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $applicant_id);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    $level = 'shs';
    $applicant = $row;
} else {
    // Try JHS
    $stmt->close();
    $sql2 = "SELECT * FROM jhs_applicants WHERE applicant_id = ?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $applicant_id);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    if ($row2 = $res2->fetch_assoc()) {
        $level = 'jhs';
        $applicant = $row2;
        $stmt2->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Applicant not found']);
        $stmt->close();
        $conn->close();
        exit;
    }
}

// Check section adviser permission: get section_id from applicant and check sections_list.adviser
$section_id = $applicant['section_id'] ?? null;
if ($section_id) {
    $secStmt = $conn->prepare("SELECT adviser FROM sections_list WHERE section_id = ?");
    $secStmt->bind_param("i", $section_id);
    $secStmt->execute();
    $sres = $secStmt->get_result();
    $srow = $sres->fetch_assoc();
    $secStmt->close();
    $adviser = $srow['adviser'] ?? null;
    if (intval($adviser) !== intval($teacher_id)) {
        echo json_encode(['status' => 'error', 'message' => 'You are not the adviser of this section']);
        $conn->close();
        exit;
    }
} else {
    // If no section_id, deny edit (safety)
    echo json_encode(['status' => 'error', 'message' => 'Applicant has no section assigned']);
    $conn->close();
    exit;
}

// Fetch guardian
if ($level === 'shs') {
    $gStmt = $conn->prepare("SELECT * FROM shs_applicant_guardians WHERE applicant_id = ?");
} else {
    $gStmt = $conn->prepare("SELECT * FROM jhs_applicant_guardians WHERE applicant_id = ?");
}
$gStmt->bind_param("i", $applicant_id);
$gStmt->execute();
$gres = $gStmt->get_result();
$guardian = $gres->fetch_assoc() ?: [];
$gStmt->close();

// Fetch documents
if ($level === 'shs') {
    $dStmt = $conn->prepare("SELECT * FROM shs_applicant_documents WHERE applicant_id = ?");
} else {
    $dStmt = $conn->prepare("SELECT * FROM jhs_applicant_documents WHERE applicant_id = ?");
}
$dStmt->bind_param("i", $applicant_id);
$dStmt->execute();
$dres = $dStmt->get_result();
$documents = $dres->fetch_assoc() ?: [];
$dStmt->close();

echo json_encode([
    'status' => 'success',
    'level' => $level,
    'applicant' => $applicant,
    'guardian' => $guardian,
    'documents' => $documents
]);

$conn->close();
?>
