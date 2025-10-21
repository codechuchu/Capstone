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
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $studentId = intval($_GET['student_id'] ?? 0);
    $level = strtolower($_GET['level'] ?? 'jhs');

    if (!$studentId) {
        echo json_encode([]);
        exit;
    }

    if ($level === 'senior high') {
        $stmt = $pdo->prepare("
            SELECT subject_name
            FROM shs_studentgrade g
            JOIN subjects s ON g.subject_id = s.subject_id
            WHERE g.student_id = ? AND g.status = 'failed'
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT subject_name
            FROM studentgrade g
            JOIN subjects s ON g.subject_id = s.subject_id
            WHERE g.student_id = ? AND g.status = 'failed'
        ");
    }

    $stmt->execute([$studentId]);
    $failedSubjects = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($failedSubjects);

} catch (Throwable $e) {
    echo json_encode([]);
}
?>
