<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "DB connection failed"]);
    exit;
}

$result = $conn->query("SELECT id, image_path FROM frontpage_banners ORDER BY id DESC");
$banners = [];

while ($row = $result->fetch_assoc()) {
    $banners[] = $row;
}

echo json_encode(["success" => true, "data" => $banners]);
$conn->close();
