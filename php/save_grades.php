<?php
session_start();
header('Content-Type: application/json');

$pdo = new PDO("mysql:host=localhost;dbname=sulivannhs;charset=utf8mb4", "root", "", [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

$student_id = intval($_POST['student_id'] ?? 0);
$section_id = intval($_POST['section_id'] ?? 0);
$subject_id = intval($_POST['subject_id'] ?? 0);

if (!$student_id || !$section_id || !$subject_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing student, section, or subject ID']);
    exit;
}

$assigned_level = $_SESSION['assigned_level'] ?? null;
if (!$assigned_level) {
    echo json_encode(['status' => 'error', 'message' => 'No assigned level in session']);
    exit;
}

try {
    if ($assigned_level === "Junior High") {
        // Get grade level from applicant table
        $stmt = $pdo->prepare("SELECT grade_level FROM jhs_applicants WHERE applicant_id=?");
        $stmt->execute([$student_id]);
        $grade_level = $stmt->fetchColumn();

        // JHS grading
        $q1 = isset($_POST['q1']) && $_POST['q1'] !== '' ? (float)$_POST['q1'] : null;
        $q2 = isset($_POST['q2']) && $_POST['q2'] !== '' ? (float)$_POST['q2'] : null;
        $q3 = isset($_POST['q3']) && $_POST['q3'] !== '' ? (float)$_POST['q3'] : null;
        $q4 = isset($_POST['q4']) && $_POST['q4'] !== '' ? (float)$_POST['q4'] : null;

        $average = null;
        $status = "active";
        if ($q1 !== null && $q2 !== null && $q3 !== null && $q4 !== null) {
            $average = ($q1 + $q2 + $q3 + $q4) / 4;
            $status = "completed";
        }

        // Check if record exists
        $stmt = $pdo->prepare("SELECT grade_id FROM studentgrade WHERE student_id=? AND section_id=? AND subject_id=?");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE studentgrade SET q1=?, q2=?, q3=?, q4=?, average=?, grade_level=?, status=?, encoded_by=? WHERE grade_id=?");
            $stmt->execute([$q1, $q2, $q3, $q4, $average, $grade_level, $status, $_SESSION['user_id'] ?? null, $existing['grade_id']]);
            echo json_encode(['status' => 'success', 'message' => 'Grades updated successfully']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO studentgrade (student_id, section_id, subject_id, q1, q2, q3, q4, average, grade_level, status, encoded_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$student_id, $section_id, $subject_id, $q1, $q2, $q3, $q4, $average, $grade_level, $status, $_SESSION['user_id'] ?? null]);
            echo json_encode(['status' => 'success', 'message' => 'Grades saved successfully']);
        }

    } elseif ($assigned_level === "Senior High") {
        // Get grade level from applicant table
        $stmt = $pdo->prepare("SELECT grade_level FROM shs_applicant WHERE applicant_id=?");
        $stmt->execute([$student_id]);
        $grade_level = $stmt->fetchColumn();

        // SHS grading
        $first_q1 = isset($_POST['first_sem_q1']) && $_POST['first_sem_q1'] !== '' ? (float)$_POST['first_sem_q1'] : null;
        $first_q2 = isset($_POST['first_sem_q2']) && $_POST['first_sem_q2'] !== '' ? (float)$_POST['first_sem_q2'] : null;
        $first_avg = ($first_q1 !== null && $first_q2 !== null) ? (($first_q1 + $first_q2) / 2) : null;

        $second_q3 = isset($_POST['second_sem_q3']) && $_POST['second_sem_q3'] !== '' ? (float)$_POST['second_sem_q3'] : null;
        $second_q4 = isset($_POST['second_sem_q4']) && $_POST['second_sem_q4'] !== '' ? (float)$_POST['second_sem_q4'] : null;
        $second_avg = ($second_q3 !== null && $second_q4 !== null) ? (($second_q3 + $second_q4) / 2) : null;

        $status = "active";
        if ($first_avg !== null && $second_avg !== null) {
            $status = "completed";
        }

        // Check if record exists
        $stmt = $pdo->prepare("SELECT grade_id FROM shs_studentgrade WHERE student_id=? AND section_id=? AND subject_id=?");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE shs_studentgrade SET first_sem_q1=?, first_sem_q2=?, first_sem_avg=?, second_sem_q3=?, second_sem_q4=?, second_sem_avg=?, grade_level=?, status=?, encoded_by=? WHERE grade_id=?");
            $stmt->execute([$first_q1, $first_q2, $first_avg, $second_q3, $second_q4, $second_avg, $grade_level, $status, $_SESSION['user_id'] ?? null, $existing['grade_id']]);
            echo json_encode(['status' => 'success', 'message' => 'SHS grades updated successfully']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO shs_studentgrade (student_id, section_id, subject_id, first_sem_q1, first_sem_q2, first_sem_avg, second_sem_q3, second_sem_q4, second_sem_avg, grade_level, status, encoded_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$student_id, $section_id, $subject_id, $first_q1, $first_q2, $first_avg, $second_q3, $second_q4, $second_avg, $grade_level, $status, $_SESSION['user_id'] ?? null]);
            echo json_encode(['status' => 'success', 'message' => 'SHS grades saved successfully']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid assigned level']);
    }

} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
