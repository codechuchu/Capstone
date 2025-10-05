<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['teacher_id'] ?? 0);

    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM teachers WHERE teacher_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Teacher removed successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to remove teacher"]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Invalid teacher ID"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
