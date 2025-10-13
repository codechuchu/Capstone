<?php
session_start();
header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=sulivannhs;charset=utf8mb4", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    if (!isset($_SESSION['assigned_level'])) {
        echo json_encode(["error" => "Assigned level not found in session"]);
        exit;
    }

    $assigned_level = $_SESSION['assigned_level'];

    $student_id = intval($_GET['student_id'] ?? 0);
    $section_id = intval($_GET['section_id'] ?? 0);
    $subject_id = intval($_GET['subject_id'] ?? 0);

    if (!$student_id || !$section_id || !$subject_id) {
        echo json_encode(["error" => "Student ID, Section ID, and Subject ID are required"]);
        exit;
    }

    if ($assigned_level === "Junior High") {
        // Junior High
        $stmt = $pdo->prepare("
            SELECT q1, q2, q3, q4, average 
            FROM studentgrade 
            WHERE student_id = ? AND section_id = ? AND subject_id = ?
        ");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $grades = $stmt->fetchAll();

    } elseif ($assigned_level === "Senior High") {
        // Senior High (updated columns)
        $stmt = $pdo->prepare("
            SELECT q1_grade, q2_grade, final_grade, remarks 
            FROM shs_studentgrade 
            WHERE student_id = ? AND section_id = ? AND subject_id = ?
        ");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $grades = $stmt->fetchAll();
    } else {
        echo json_encode(["error" => "Invalid assigned level"]);
        exit;
    }

    echo json_encode($grades ?: []);

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
