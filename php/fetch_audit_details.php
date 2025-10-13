<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Check session values
$role = $_SESSION['role'] ?? '';
$assigned_level = $_SESSION['assigned_level'] ?? '';
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// If no role in session, stop here
if (!$role) {
    echo json_encode(["success" => false, "message" => "Session expired or user not logged in"]);
    exit;
}

// Base query
$query = "SELECT * FROM audit_trail";
$conditions = [];

// If specific ID is requested
if ($id > 0) {
    $conditions[] = "id = $id";
} else {
    // Filter based on assigned level for admins/teachers
    if (in_array(strtolower($role), ["admin", "teachers"]) && !empty($assigned_level)) {
        $conditions[] = "(details LIKE '%" . $conn->real_escape_string($assigned_level) . "%')";
    }

    // Filter for students (based on grade level)
    if ($role === "students") {
        $student_id = $_SESSION['user_id'] ?? 0;
        if ($student_id > 0) {
            $conditions[] = "user_id = $student_id";
        }
    }
}

// Combine WHERE clauses
if (!empty($conditions)) {
    $query .= " WHERE " . implode(" AND ", $conditions);
}

$query .= " ORDER BY timestamp DESC";

$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode(["success" => true, "data" => $data]);
} else {
    echo json_encode(["success" => false, "message" => "No records found for your level or role"]);
}

$conn->close();
?>
