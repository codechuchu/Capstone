<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$assigned_level = strtolower(trim($_SESSION['assigned_level'] ?? ''));

$response = [
    "success" => true,
    "grades" => [],
    "strands" => []
];

// Junior High = Grades 7–10 (no strands)
if ($assigned_level === "junior high") {
    $response["grades"] = [7, 8, 9, 10];
    $response["strands"] = []; // no strands
}

// Senior High = Grades 11–12 + strands from DB
elseif ($assigned_level === "senior high") {
    $response["grades"] = [11, 12];

    $sql = "SELECT strand FROM strand";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $response["strands"][] = $row['strand'];
        }
    }
} else {
    $response["success"] = false;
    $response["message"] = "Invalid assigned level: " . $assigned_level;
}

echo json_encode($response);
$conn->close();
?>
