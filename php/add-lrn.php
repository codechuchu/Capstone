<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parents') {
    echo json_encode(["status" => "error", "message" => "Parent not logged in"]);
    exit;
}

$parentId = $_SESSION['user_id'];
$lrn = $_POST['childLrn'] ?? '';

if (empty($lrn)) {
    echo json_encode(["status" => "error", "message" => "LRN is required"]);
    exit;
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Sanitize input
$lrn = $conn->real_escape_string(trim($lrn));

// Get current LRNs
$result = $conn->query("SELECT lrn FROM parents WHERE id = $parentId");
$current = "";
if ($result && $row = $result->fetch_assoc()) {
    $current = $row['lrn'];
}

// Append new LRN
$newLrns = $current ? $current . ',' . $lrn : $lrn;

// Update the column
$stmt = $conn->prepare("UPDATE parents SET lrn = ? WHERE id = ?");
$stmt->bind_param("si", $newLrns, $parentId);

if ($stmt->execute()) {

    // ✅ Audit log
    include_once __DIR__ . '/log_audit.php';
    $action = "Added Child LRN";
    $details = "Parent ID: $parentId added child LRN: $lrn";
    $logConn = new mysqli($servername, $username, $password, $dbname);
    logAction($logConn, $_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'], $action, $details);
    $logConn->close();
    // --------------------

    echo json_encode(["status" => "success", "message" => "LRN added successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to add LRN"]);
}

$stmt->close();
$conn->close();
?>
