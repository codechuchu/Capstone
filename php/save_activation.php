<?php
header('Content-Type: application/json');

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$start_date = $data["start_date"] ?? null;
$end_date   = $data["end_date"] ?? null;

if (!$start_date || !$end_date) {
    echo json_encode(["status" => "error", "message" => "Start and End dates are required"]);
    exit;
}

// Save into DB (only one row, update if exists)
$stmt = $conn->prepare("REPLACE INTO activation_periods (id, start_date, end_date) VALUES (1, ?, ?)");
$stmt->bind_param("ss", $start_date, $end_date);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Activation period saved"]);
} else {
    echo json_encode(["status" => "error", "message" => "DB error: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
