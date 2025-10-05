<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = intval($_POST['teacher_id'] ?? 0);

    if ($id > 0) {
        // Fetch teacher's lastname
        $result = $conn->query("SELECT lastname FROM teachers WHERE teacher_id = $id LIMIT 1");
        if ($result && $row = $result->fetch_assoc()) {
            $lastname = $row['lastname'];

            // Reset password = lastname + 123
            $newPassword = $lastname . "123";

            $stmt = $conn->prepare("UPDATE teachers SET password = ? WHERE teacher_id = ?");
            $stmt->bind_param("si", $newPassword, $id);

            if ($stmt->execute()) {
                echo json_encode([
                    "success" => true,
                    "message" => "Password reset to '$newPassword'"
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Failed to reset password"
                ]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Teacher not found"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid teacher ID"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
