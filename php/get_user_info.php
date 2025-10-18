<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$userId = $_SESSION['user_id'];
$role = $_SESSION['role'];

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Determine table and ID column
$table = "";
$idColumn = "";
switch ($role) {
    case "admin":
        $table = "admin";
        $idColumn = "id";
        break;
    case "teachers":
        $table = "teachers";
        $idColumn = "teacher_id";
        break;
    case "students":
        $table = "students";
        $idColumn = "student_id";
        break;
    case "parents":
        $table = "parents";
        $idColumn = "id";
        break;
}

$stmt = $conn->prepare("SELECT $idColumn AS id, firstname, lastname, email FROM $table WHERE $idColumn = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "id" => $user['id'],
        "firstname" => $user['firstname'],
        "lastname" => $user['lastname'],
        "email" => $user['email'],
        "role" => $role
    ]);
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$stmt->close();
$conn->close();
?>
