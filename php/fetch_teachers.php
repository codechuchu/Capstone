<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Default query
$sql = "SELECT teacher_id, firstname, middlename, lastname, email, password, assigned_level, subjects FROM teachers";

// Check session for assigned_level
if (isset($_SESSION['assigned_level']) && !empty($_SESSION['assigned_level'])) {
    $assigned_level = $_SESSION['assigned_level'];
    $stmt = $conn->prepare("SELECT teacher_id, firstname, middlename, lastname, email, password, assigned_level, subjects
                            FROM teachers WHERE assigned_level = ?");
    $stmt->bind_param("s", $assigned_level);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    // If no assigned_level in session, just get all teachers
    $result = $conn->query($sql);
}

$teachers = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $teachers[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "teachers" => $teachers
]);

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
