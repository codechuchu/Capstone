<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'parents') {
    echo json_encode(["status" => "error", "message" => "Parent not logged in"]);
    exit;
}

$parentId = $_SESSION['user_id'];

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Get the LRN column
$result = $conn->query("SELECT lrn FROM parents WHERE id = $parentId");
if (!$result || $result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Parent not found"]);
    exit;
}

$row = $result->fetch_assoc();
$lrnString = $row['lrn']; // e.g., "123123,1050180080"
$lrns = array_filter(array_map('trim', explode(',', $lrnString))); // split and remove empty

$children = [];

foreach ($lrns as $lrn) {
    // First, try SHS applicants
    $stmt = $conn->prepare("SELECT firstname, lastname, grade_level FROM shs_applicant WHERE lrn = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($user = $res->fetch_assoc()) {
        $level = (int)$user['grade_level'] >= 11 ? "SHS" : "JHS"; // Determine level
        $children[] = [
            "lrn" => $lrn,
            "name" => $user['firstname'] . ' ' . $user['lastname'],
            "level" => $level
        ];
    }
    $stmt->close();

    // Then check JHS applicants
    $stmt = $conn->prepare("SELECT firstname, lastname, grade_level FROM jhs_applicants WHERE lrn = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($user = $res->fetch_assoc()) {
        $level = (int)$user['grade_level'] >= 11 ? "SHS" : "JHS"; // Determine level
        $children[] = [
            "lrn" => $lrn,
            "name" => $user['firstname'] . ' ' . $user['lastname'],
            "level" => $level
        ];
    }
    $stmt->close();
}

echo json_encode(["status" => "success", "children" => $children]);
$conn->close();
?>
