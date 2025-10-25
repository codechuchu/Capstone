<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    $assigned_level = isset($_SESSION['assigned_level']) ? $_SESSION['assigned_level'] : null;

    if ($assigned_level) {
        $stmt = $conn->prepare("SELECT firstname, middlename, lastname FROM teachers WHERE assigned_level = ? ORDER BY lastname ASC");
        $stmt->bind_param("s", $assigned_level);
    } else {
        $stmt = $conn->prepare("SELECT firstname, middlename, lastname FROM teachers ORDER BY lastname ASC");
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $teachers = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        "success" => true,
        "teachers" => $teachers
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
