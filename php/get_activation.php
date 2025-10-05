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

$sql = "SELECT start_date, end_date FROM activation_periods WHERE id = 1 LIMIT 1";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        "status" => "success",
        "data" => [
            "start_date" => $row["start_date"],
            "end_date"   => $row["end_date"]
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "No activation period found"]);
}

$conn->close();
?>
