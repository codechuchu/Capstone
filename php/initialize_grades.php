<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
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
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$section_id = $data['section_id'] ?? null;
$schedules  = $data['schedules'] ?? [];

if (!$section_id || empty($schedules)) {
    echo json_encode(['status' => 'error', 'message' => 'Section ID or schedules missing.']);
    exit;
}

try {
    // Fetch students in section
    $stmt = $pdo->prepare("SELECT student_id, grade_level FROM section WHERE section_id = ?");
    $stmt->execute([$section_id]);
    $students = $stmt->fetchAll();

    if (!$students) {
        echo json_encode(['status' => 'error', 'message' => 'No students found in this section.']);
        exit;
    }

    $insertedCount = 0;
    $now = date('Y-m-d H:i:s');
    $encoded_by = $_SESSION['user_id'] ?? null;

    foreach ($students as $student) {
        $student_id = $student['student_id'];
        $grade_level = $student['grade_level'];

        // Determine table and default columns
        if ($grade_level >= 11) {
            $table = 'shs_studentgrade';
            $columns = ['q1_grade' => null, 'q2_grade' => null, 'final_grade' => null, 'remarks' => null];
        } else {
            $table = 'studentgrade';
            $columns = ['q1' => null, 'q2' => null, 'q3' => null, 'q4' => null, 'average' => null];
        }

        foreach ($schedules as $sched) {
            $subject_id = $sched['subject_id'];

            // Check if record already exists
            $checkStmt = $pdo->prepare("SELECT 1 FROM $table WHERE student_id = ? AND subject_id = ? LIMIT 1");
            $checkStmt->execute([$student_id, $subject_id]);
            if ($checkStmt->fetch()) continue;

            // Prepare columns and values dynamically
            $cols = array_merge(['student_id', 'section_id', 'subject_id', 'encoded_by', 'created_at', 'updated_at', 'grade_level', 'status'], array_keys($columns));
            $placeholders = implode(',', array_fill(0, count($cols), '?'));
            $insertSQL = "INSERT INTO $table (" . implode(',', $cols) . ") VALUES ($placeholders)";
            $insertStmt = $pdo->prepare($insertSQL);

            $values = array_merge([$student_id, $section_id, $subject_id, $encoded_by, $now, $now, $grade_level, 'active'], array_values($columns));
            $insertStmt->execute($values);

            $insertedCount++;
        }
    }

    echo json_encode(['status' => 'success', 'message' => "$insertedCount grades initialized."]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to initialize grades: ' . $e->getMessage()]);
}
