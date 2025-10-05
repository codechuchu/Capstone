<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'students') {
    echo json_encode(["error" => "Student not logged in"]);
    exit;
}

$student_id = $_SESSION['user_id'];

$pdo = new PDO("mysql:host=localhost;dbname=sulivannhs;charset=utf8mb4", "root", "", [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

// Fetch all grades for this student with subject info and teacher name
$stmt = $pdo->prepare("
    SELECT 
        sg.section_id, 
        sg.subject_id,
        s.name AS subject_name,
        sg.q1, sg.q2, sg.q3, sg.q4,
        CONCAT(t.firstname, ' ', t.lastname) AS teacher_name
    FROM studentgrade sg
    INNER JOIN subjects s ON sg.subject_id = s.subject_id
    LEFT JOIN teachers t ON sg.encoded_by = t.teacher_id
    WHERE sg.student_id = ?
    ORDER BY sg.section_id ASC, s.name ASC
");
$stmt->execute([$student_id]);
$grades = $stmt->fetchAll();

// Compute average for each row
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

echo json_encode($grades);
?>
