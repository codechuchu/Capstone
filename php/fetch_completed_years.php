<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$sql = "SELECT DISTINCT school_year FROM sections_list WHERE graduation_year IS NOT NULL ORDER BY school_year DESC";
$result = $conn->query($sql);

$years = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $years[] = $row;
    }
}

echo json_encode($years);
$conn->close();
?>
