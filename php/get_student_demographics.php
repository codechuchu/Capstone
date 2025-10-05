<?php
session_start();
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Get assigned level from GET parameter
$level = $_GET['level'] ?? '';
$level = strtolower(trim($level));

// Determine table based on level
if ($level === 'senior high') {
    $table = "shs_applicant";
    $gradeCondition = "grade_level IN (11,12)";
} elseif ($level === 'junior high') {
    $table = "jhs_applicants";
    $gradeCondition = "grade_level BETWEEN 7 AND 10";
} else {
    echo json_encode(['error' => 'Invalid assigned level']);
    exit;
}

// 1. Total students
$totalRes = $conn->query("SELECT COUNT(*) as total FROM $table WHERE $gradeCondition");
$total = $totalRes->fetch_assoc()['total'] ?? 0;

// 2. Total male and female
$maleRes = $conn->query("SELECT COUNT(*) as male FROM $table WHERE gender='Male' AND $gradeCondition");
$male = $maleRes->fetch_assoc()['male'] ?? 0;

$femaleRes = $conn->query("SELECT COUNT(*) as female FROM $table WHERE gender='Female' AND $gradeCondition");
$female = $femaleRes->fetch_assoc()['female'] ?? 0;

if ($level === 'senior high') {
    // 3. Total per strand
    $strandRes = $conn->query("SELECT strand, COUNT(*) as count FROM $table WHERE $gradeCondition GROUP BY strand");
    $strands = [];
    while ($row = $strandRes->fetch_assoc()) {
        $strands[$row['strand']] = (int)$row['count'];
    }

    echo json_encode([
        'total' => (int)$total,
        'male' => (int)$male,
        'female' => (int)$female,
        'strands' => $strands
    ]);
} else {
    // 3. Total per grade level (7-10 only)
    $gradeRes = $conn->query("SELECT grade_level, COUNT(*) as count FROM $table WHERE $gradeCondition GROUP BY grade_level");
    $grades = [];
    while ($row = $gradeRes->fetch_assoc()) {
        $grades[$row['grade_level']] = (int)$row['count'];
    }

    echo json_encode([
        'total' => (int)$total,
        'male' => (int)$male,
        'female' => (int)$female,
        'grade_levels' => $grades
    ]);
}
