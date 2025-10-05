<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

$today = date('Y-m-d');

$sql = "SELECT id, start_date, end_date, is_active 
        FROM school_year_periods 
        WHERE is_active = 1 
        AND start_date <= ? 
        AND end_date >= ? 
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $today, $today);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode([
        'status' => 'success',
        'data' => [
            'id' => $data['id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date']
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'success',
        'data' => null
    ]);
}

$stmt->close();
$conn->close();
