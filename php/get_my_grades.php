<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'students') {
    echo json_encode(["error" => "Student not logged in"]);
    exit;
}

$student_id = $_SESSION['user_id'];

try {
    $pdo = new PDO("mysql:host=localhost;dbname=sulivannhs;charset=utf8mb4", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Determine grade level
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM shs_studentgrade WHERE student_id = ?");
    $stmt->execute([$student_id]);
    $isSHS = $stmt->fetchColumn() > 0;

    $grade_level = $isSHS ? "SHS" : "JHS";
    $grades = [];

    if ($isSHS) {
        // Fetch SHS grades
        $stmt = $pdo->prepare("
            SELECT 
                sg.section_id,
                sg.subject_id,
                s.name AS subject_name,
                sg.q1_grade,
                sg.q2_grade,
                sg.final_grade,
                sg.remarks,
                CONCAT(t.firstname, ' ', t.lastname) AS encoded_by,
                sg.created_at,
                sg.updated_at
            FROM shs_studentgrade sg
            INNER JOIN subjects s ON sg.subject_id = s.subject_id
            LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
            WHERE sg.student_id = ?
            ORDER BY sg.section_id ASC, s.name ASC
        ");
        $stmt->execute([$student_id]);
        $grades = $stmt->fetchAll();
    } else {
        // Fetch JHS grades
        $stmt = $pdo->prepare("
            SELECT 
                sg.section_id,
                sg.subject_id,
                s.name AS subject_name,
                sg.q1,
                sg.q2,
                sg.q3,
                sg.q4,
                CONCAT(t.firstname, ' ', t.lastname) AS teacher_name,
                sg.created_at,
                sg.updated_at
            FROM studentgrade sg
            INNER JOIN subjects s ON sg.subject_id = s.subject_id
            LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
            WHERE sg.student_id = ?
            ORDER BY sg.section_id ASC, s.name ASC
        ");
        $stmt->execute([$student_id]);
        $grades = $stmt->fetchAll();

        // Compute average for each JHS row
        foreach ($grades as &$row) {
            $total = 0;
            $count = 0;
            for ($i = 1; $i <= 4; $i++) {
                if (!is_null($row["q$i"])) {
                    $total += $row["q$i"];
                    $count++;
                }
            }
            $row['average'] = $count > 0 ? round($total / $count, 2) : null;
        }
    }

    echo json_encode([
        "status" => "success",
        "level" => $grade_level,
        "grades" => $grades
    ]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit;
}
?>
