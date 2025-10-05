<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Add if CORS issues (for local testing)
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$lrn = $data['lrn'] ?? '';

if (!$lrn) {
    echo json_encode(["success" => false, "error" => "LRN is required"]);
    exit;
}

// Use prepared statements for security (better than real_escape_string)
$stmt = $conn->prepare("SELECT status FROM shs_applicant WHERE lrn = ? LIMIT 1");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(["success" => true, "status" => $row['status']]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT status FROM jhs_applicants WHERE lrn = ? LIMIT 1");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(["success" => true, "status" => $row['status']]);
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "error" => "LRN not found"]);
$stmt->close();
$conn->close();
?>
