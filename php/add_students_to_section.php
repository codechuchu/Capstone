<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();

// 🔒 Require login + role check
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

// Include audit logging
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

    $input = json_decode(file_get_contents("php://input"), true);
    $section_id = $input['section_id'] ?? null;
    $student_ids = $input['student_ids'] ?? [];
    $level = strtolower($input['level'] ?? ''); // expects 'shs' or 'jhs'

    if (!$section_id || empty($student_ids) || !in_array($level, ['shs', 'jhs'])) {
        echo json_encode(["success" => false, "error" => "Missing or invalid section_id, student_ids, or level"]);
        exit;
    }

    // 🧩 Choose tables dynamically based on level
    $applicant_table = ($level === 'shs') ? 'shs_applicant' : 'jhs_applicants';

    // Prepare statements
    $stmtUpdate = $pdo->prepare("UPDATE {$applicant_table} SET section_id = :section_id WHERE applicant_id = :student_id");
    $stmtFetchStudent = $pdo->prepare("
        SELECT applicant_id AS student_id,
               CONCAT(firstname, ' ', lastname) AS student_name,
               " . ($level === 'shs' ? "strand," : "'' AS strand,") . "
               grade_level
        FROM {$applicant_table}
        WHERE applicant_id = :student_id
        LIMIT 1
    ");
    $stmtInsert = $pdo->prepare("
        INSERT INTO section (section_id, student_name, strand, grade_level, student_id)
        VALUES (:section_id, :student_name, :strand, :grade_level, :student_id)
    ");

    // mysqli for audit logging
    $conn = new mysqli($host, $user, $pass, $db);

    foreach ($student_ids as $sid) {
        // Update applicant table (assign section)
        $stmtUpdate->execute([
            ':section_id' => $section_id,
            ':student_id' => $sid
        ]);

        // Fetch student info
        $stmtFetchStudent->execute([':student_id' => $sid]);
        $student = $stmtFetchStudent->fetch();

        if ($student) {
            try {
                // Insert into section table
                $stmtInsert->execute([
                    ':section_id'   => $section_id,
                    ':student_name' => $student['student_name'],
                    ':strand'       => $student['strand'],
                    ':grade_level'  => $student['grade_level'],
                    ':student_id'   => $student['student_id']
                ]);

                // ✅ Log audit for each student
                $action = "Assigned Student to Section";
                $details = strtoupper($level) . " Student: {$student['student_name']} (ID: {$student['student_id']}) assigned to Section ID: $section_id";
                logAction($conn, $_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'], $action, $details);

            } catch (PDOException $dup) {
                // Ignore duplicate insert errors
            }
        }
    }

    // Recalculate total students
    $recalc = $pdo->prepare("SELECT COUNT(*) AS total FROM {$applicant_table} WHERE section_id = :section_id AND status = 'enrolled'");
    $recalc->execute([':section_id' => $section_id]);
    $row = $recalc->fetch();

    $update = $pdo->prepare("UPDATE sections_list SET total_students = :total WHERE section_id = :section_id");
    $update->execute([
        ':total' => $row['total'],
        ':section_id' => $section_id
    ]);

    $conn->close();

    echo json_encode(["success" => true, "new_total" => $row['total']]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Database error"]);
}
