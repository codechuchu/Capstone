<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

include_once __DIR__ . '/log_audit.php';

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

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $conn = new mysqli($host, $user, $pass, $db);

    $input = json_decode(file_get_contents("php://input"), true);
    $student_id = $input['student_id'] ?? null;

    if (!$student_id) {
        echo json_encode(["success" => false, "error" => "Missing student_id"]);
        exit;
    }

    // Try SHS first
    $stmtCheckSHS = $pdo->prepare("SELECT section_id, CONCAT(firstname, ' ', lastname) AS name FROM shs_applicant WHERE applicant_id = :id LIMIT 1");
    $stmtCheckSHS->execute([':id' => $student_id]);
    $shsStudent = $stmtCheckSHS->fetch();

    // Try JHS next if not found in SHS
    $stmtCheckJHS = $pdo->prepare("SELECT section_id, CONCAT(firstname, ' ', lastname) AS name FROM jhs_applicants WHERE applicant_id = :id LIMIT 1");
    $stmtCheckJHS->execute([':id' => $student_id]);
    $jhsStudent = $stmtCheckJHS->fetch();

    $level = null;
    $section_id = null;
    $student_name = null;

    if ($shsStudent) {
        $level = 'shs';
        $section_id = $shsStudent['section_id'];
        $student_name = $shsStudent['name'];
    } elseif ($jhsStudent) {
        $level = 'jhs';
        $section_id = $jhsStudent['section_id'];
        $student_name = $jhsStudent['name'];
    } else {
        echo json_encode(["success" => false, "error" => "Student not found"]);
        exit;
    }

    if (!$section_id) {
        echo json_encode(["success" => false, "error" => "Student is not assigned to any section"]);
        exit;
    }

    // 1️⃣ Set section_id = NULL
    if ($level === 'shs') {
        $pdo->prepare("UPDATE shs_applicant SET section_id = NULL WHERE applicant_id = :id")->execute([':id' => $student_id]);
    } else {
        $pdo->prepare("UPDATE jhs_applicants SET section_id = NULL WHERE applicant_id = :id")->execute([':id' => $student_id]);
    }

    // 2️⃣ Remove student from section table
    $pdo->prepare("DELETE FROM section WHERE student_id = :id AND section_id = :sid")->execute([
        ':id' => $student_id,
        ':sid' => $section_id
    ]);

    // 3️⃣ Recalculate total_students
    if ($level === 'shs') {
        $recalc = $pdo->prepare("SELECT COUNT(*) AS total FROM shs_applicant WHERE section_id = :sid AND status = 'enrolled'");
    } else {
        $recalc = $pdo->prepare("SELECT COUNT(*) AS total FROM jhs_applicants WHERE section_id = :sid AND status = 'enrolled'");
    }

    $recalc->execute([':sid' => $section_id]);
    $newTotal = $recalc->fetch()['total'] ?? 0;

    $pdo->prepare("UPDATE sections_list SET total_students = :total WHERE section_id = :sid")->execute([
        ':total' => $newTotal,
        ':sid' => $section_id
    ]);

    // 4️⃣ Log action
    $action = "Removed Student from Section";
    $details = "Student {$student_name} (ID: {$student_id}) removed from Section ID {$section_id}";
    logAction($conn, $_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'], $action, $details);

    echo json_encode(["success" => true, "new_total" => $newTotal]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Database error"]);
}
