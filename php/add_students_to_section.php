<?php
ini_set('display_errors', 0); // hide errors in production
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();
// 🔒 Require login + role check
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

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

    if (!$section_id || empty($student_ids)) {
        echo json_encode(["success" => false, "error" => "Missing section_id or student_ids"]);
        exit;
    }

    // Prepared statements
    $stmtUpdate = $pdo->prepare("UPDATE shs_applicant SET section_id = :section_id WHERE applicant_id = :student_id");

    $stmtFetchStudent = $pdo->prepare("
        SELECT applicant_id AS student_id,
               CONCAT(firstname, ' ', lastname) AS student_name,
               strand,
               grade_level
        FROM shs_applicant
        WHERE applicant_id = :student_id
        LIMIT 1
    ");

    $stmtInsert = $pdo->prepare("
        INSERT INTO section (section_id, student_name, strand, grade_level, student_id)
        VALUES (:section_id, :student_name, :strand, :grade_level, :student_id)
    ");

    foreach ($student_ids as $sid) {
        // Update applicant table
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
            } catch (PDOException $dup) {
                // Ignore duplicate insert errors
            }
        }
    }

    // Recalculate total_students
    $recalc = $pdo->prepare("SELECT COUNT(*) AS total FROM shs_applicant WHERE section_id = :section_id AND status = 'enrolled'");
    $recalc->execute([':section_id' => $section_id]);
    $row = $recalc->fetch();

    $update = $pdo->prepare("UPDATE sections_list SET total_students = :total WHERE section_id = :section_id");
    $update->execute([
        ':total' => $row['total'],
        ':section_id' => $section_id
    ]);

    echo json_encode(["success" => true, "new_total" => $row['total']]);

} catch (PDOException $e) {
    // don’t leak DB info
    echo json_encode(["success" => false, "error" => "Database error"]);
}
