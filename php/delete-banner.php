<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "DB connection failed"]);
    exit;
}

$id = $_POST['id'] ?? null;

if ($id) {
    $stmt = $conn->prepare("SELECT image_path FROM frontpage_banners WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->bind_result($path);
    $stmt->fetch();
    $stmt->close();

    if ($path && file_exists(__DIR__ . "/../" . $path)) {
        unlink(__DIR__ . "/../" . $path);
    }

    $stmt = $conn->prepare("DELETE FROM frontpage_banners WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => "No ID provided"]);
}

$conn->close();
