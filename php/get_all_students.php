<?php
// Show errors for debugging (turn off in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
session_start();

// DB connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Get assigned level from GET parameter or session
$assigned_level = $_GET['level'] ?? ($_SESSION['assigned_level'] ?? '');
$assigned_level = strtolower($assigned_level);

$students = [];

if ($assigned_level === 'junior high') {
    // JHS table: remove strand & semester
    $sql = "SELECT applicant_id, firstname, lastname, grade_level, 
                   barangay, municipal_city, province, cellphone, emailaddress
            FROM jhs_applicants
            ORDER BY lastname ASC";

    $result = $conn->query($sql);
    if (!$result) {
        echo json_encode(['success' => false, 'message' => 'Query failed', 'error' => $conn->error]);
        exit;
    }

    while ($row = $result->fetch_assoc()) {
        $students[] = [
            'applicant_id'  => $row['applicant_id'],  // Changed from 'id' to 'applicant_id'
            'firstname'     => $row['firstname'] ?? '',
            'lastname'      => $row['lastname'] ?? '',
            'strand'        => '',              // JHS has no strand
            'grade_level'   => $row['grade_level'] ?? '',
            'semester'      => '',              // JHS has no semester
            'barangay'      => $row['barangay'] ?? '',
            'municipal_city'=> $row['municipal_city'] ?? '',
            'province'      => $row['province'] ?? '',
            'cellphone'     => $row['cellphone'] ?? '',
            'emailaddress'  => $row['emailaddress'] ?? ''
        ];
    }

} elseif ($assigned_level === 'senior high') {
    // SHS table
    $sql = "SELECT applicant_id, firstname, lastname, strand, grade_level, semester, 
                   barangay, municipal_city, province, cellphone, emailaddress
            FROM shs_applicant
            ORDER BY lastname ASC";

    $result = $conn->query($sql);
    if (!$result) {
        echo json_encode(['success' => false, 'message' => 'Query failed', 'error' => $conn->error]);
        exit;
    }

    while ($row = $result->fetch_assoc()) {
        $students[] = [
            'applicant_id'  => $row['applicant_id'],  // Changed from 'id' to 'applicant_id'
            'firstname'     => $row['firstname'] ?? '',
            'lastname'      => $row['lastname'] ?? '',
            'strand'        => $row['strand'] ?? '',
            'grade_level'   => $row['grade_level'] ?? '',
            'semester'      => $row['semester'] ?? '',
            'barangay'      => $row['barangay'] ?? '',
            'municipal_city'=> $row['municipal_city'] ?? '',
            'province'      => $row['province'] ?? '',
            'cellphone'     => $row['cellphone'] ?? '',
            'emailaddress'  => $row['emailaddress'] ?? ''
        ];
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid assigned level']);
    exit;
}

// Return JSON
echo json_encode(['success' => true, 'students' => $students]);
$conn->close();
exit;
?>
