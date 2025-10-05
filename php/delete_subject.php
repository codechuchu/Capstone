<?php
session_start();
header('Content-Type: application/json');

// ✅ Turn off HTML error output
ini_set('display_errors', 0);
error_reporting(E_ALL);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// ✅ Get JSON input safely
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON input", "raw" => $raw]);
    exit;
}

$id = intval($data["id"] ?? 0);
if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid subject ID"]);
    exit;
}

// ✅ Prefer `level` from JSON, fallback to session
$assigned_level = strtolower($data["level"] ?? ($_SESSION['assigned_level'] ?? ''));

if (!$assigned_level) {
    echo json_encode(["success" => false, "message" => "No assigned level found"]);
    exit;
}

$stmt = null;

// 🟢 Junior High delete
if ($assigned_level === "junior high") {
    $stmt = $conn->prepare("DELETE FROM jhs_subjects WHERE subject_id = ?");
    $stmt->bind_param("i", $id);
}
// 🟡 Senior High delete
elseif ($assigned_level === "senior high") {
    $stmt = $conn->prepare("DELETE FROM subjects WHERE subject_id = ?");
    $stmt->bind_param("i", $id);
} else {
    echo json_encode(["success" => false, "message" => "Invalid assigned level"]);
    exit;
}

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Subject deleted successfully",
        "deleted_id" => $id,        // ✅ return deleted ID for debugging
        "level" => $assigned_level  // ✅ return level used
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Delete failed",
        "error" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
