<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];
$pdo = new PDO($dsn, $user, $pass, $options);

if (!isset($_SESSION['assigned_level'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$grade  = trim($data['grade'] ?? '');
$strand = trim($data['strand'] ?? '');
$assigned_level = strtolower($_SESSION['assigned_level']);

if ($grade === '') {
    echo json_encode(["error" => "Grade is required"]);
    exit;
}

if ($assigned_level === 'senior high') {
    if ($strand === '') {
        echo json_encode(["error" => "Strand is required"]);
        exit;
    }
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM shs_applicant
        WHERE LOWER(strand) = LOWER(?)
          AND grade_level = ?
          AND LOWER(status) = 'enrolled'
          AND section_id IS NULL
    ");
    $stmt->execute([$strand, $grade]);
} elseif ($assigned_level === 'junior high') {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM jhs_applicants
        WHERE grade_level = ?
          AND LOWER(status) = 'enrolled'
          AND section_id IS NULL
    ");
    $stmt->execute([$grade]);
} else {
    echo json_encode(["error" => "Invalid assigned level"]);
    exit;
}

$row = $stmt->fetch();
$count = $row ? (int)$row['cnt'] : 0;

echo json_encode(["count" => $count]);
