<?php
header('Content-Type: application/json');
error_reporting(0);
date_default_timezone_set('Asia/Manila');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Get level from query string: jhs or shs
$level = strtolower($_GET['level'] ?? '');
if (!in_array($level, ['jhs','shs'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid level']);
    exit;
}

// Determine table and quarters
$table = $level === 'jhs' ? 'jhs_encoding_dates' : 'shs_encoding_dates';
$quarters = $level === 'jhs' ? ['Q1','Q2','Q3','Q4'] : ['Q1','Q2'];

// Build column list for start and end dates
$columns = [];
foreach ($quarters as $q) {
    $columns[] = $q.'_start';
    $columns[] = $q.'_end';
}

// Fetch the dates (assume single row per table)
$sql = "SELECT ".implode(",", $columns)." FROM $table LIMIT 1";
$res = $conn->query($sql);

$dates = [];
if ($res && $res->num_rows > 0) {
    $row = $res->fetch_assoc();
    foreach ($quarters as $q) {
        $dates[$q] = [
            'start' => $row[$q.'_start'] ?: null,
            'end'   => $row[$q.'_end'] ?: null
        ];
    }
} else {
    foreach ($quarters as $q) {
        $dates[$q] = ['start' => null, 'end' => null];
    }
}

echo json_encode(['success' => true, 'dates' => $dates]);

$conn->close();
