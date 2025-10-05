<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$sql = "SELECT strand FROM strand";
$result = $conn->query($sql);

$strands = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $strands[] = $row['strand'];
    }
}

echo json_encode(["success" => true, "data" => $strands]);

$conn->close();
?>
