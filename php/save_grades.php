<?php
session_start();
header('Content-Type: application/json');

try {
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

    $user_id  = $_SESSION['user_id'] ?? null;
    $username = $_SESSION['email'] ?? 'Unknown';
    $role     = $_SESSION['role'] ?? 'Unknown';
    $ip       = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $action   = "Save Grades";
    $details  = "";

    if ($assigned_level === "Junior High") {
        $stmt = $pdo->prepare("SELECT grade_level FROM jhs_applicants WHERE applicant_id=?");
        $stmt->execute([$student_id]);
        $grade_level = $stmt->fetchColumn();

        $q1 = $_POST['q1'] !== '' ? (float)$_POST['q1'] : null;
        $q2 = $_POST['q2'] !== '' ? (float)$_POST['q2'] : null;
        $q3 = $_POST['q3'] !== '' ? (float)$_POST['q3'] : null;
        $q4 = $_POST['q4'] !== '' ? (float)$_POST['q4'] : null;

        $average = null;
        $status = "active";
        if ($q1 !== null && $q2 !== null && $q3 !== null && $q4 !== null) {
            $average = ($q1 + $q2 + $q3 + $q4) / 4;
            $status = "completed";
        }

        $stmt = $pdo->prepare("SELECT grade_id FROM studentgrade WHERE student_id=? AND section_id=? AND subject_id=?");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE studentgrade 
                SET q1=?, q2=?, q3=?, q4=?, average=?, grade_level=?, status=?, encoded_by=? 
                WHERE grade_id=?");
            $stmt->execute([$q1, $q2, $q3, $q4, $average, $grade_level, $status, $user_id, $existing['grade_id']]);
            $details = "Updated JHS grades for student ID $student_id in subject ID $subject_id";
            echo json_encode(['status' => 'success', 'message' => 'Grades updated successfully']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO studentgrade 
                (student_id, section_id, subject_id, q1, q2, q3, q4, average, grade_level, status, encoded_by) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$student_id, $section_id, $subject_id, $q1, $q2, $q3, $q4, $average, $grade_level, $status, $user_id]);
            $details = "Added new JHS grades for student ID $student_id in subject ID $subject_id";
            echo json_encode(['status' => 'success', 'message' => 'Grades saved successfully']);
        }

    } elseif ($assigned_level === "Senior High") {
        $stmt = $pdo->prepare("SELECT grade_level FROM shs_applicant WHERE applicant_id=?");
        $stmt->execute([$student_id]);
        $grade_level = $stmt->fetchColumn();

        $q1_grade = (isset($_POST['q1_grade']) && is_numeric($_POST['q1_grade'])) ? (float)$_POST['q1_grade'] : null;
        $q2_grade = (isset($_POST['q2_grade']) && is_numeric($_POST['q2_grade'])) ? (float)$_POST['q2_grade'] : null;
        
        $final_grade = null;
        $remarks = null;
        $status = "active";
        
        // Only calculate final grade and remarks if BOTH grades are entered
        if ($q1_grade !== null && $q2_grade !== null) {
            $final_grade = ($q1_grade + $q2_grade) / 2;
            $remarks = ($final_grade >= 75) ? "Passed" : "Failed";
            $status = "completed";
        }
        
        $stmt = $pdo->prepare("SELECT grade_id FROM shs_studentgrade WHERE student_id=? AND section_id=? AND subject_id=?");
        $stmt->execute([$student_id, $section_id, $subject_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE shs_studentgrade 
                SET q1_grade=?, q2_grade=?, final_grade=?, remarks=?, grade_level=?, status=?, encoded_by=?, updated_at=NOW() 
                WHERE grade_id=?");
            $stmt->execute([$q1_grade, $q2_grade, $final_grade, $remarks, $grade_level, $status, $user_id, $existing['grade_id']]);
            $details = "Updated SHS grades for student ID $student_id in subject ID $subject_id";
            echo json_encode(['status' => 'success', 'message' => 'SHS grades updated successfully']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO shs_studentgrade 
                (student_id, section_id, subject_id, q1_grade, q2_grade, final_grade, remarks, grade_level, status, encoded_by, created_at) 
                VALUES (?,?,?,?,?,?,?,?,?,?,NOW())");
            $stmt->execute([$student_id, $section_id, $subject_id, $q1_grade, $q2_grade, $final_grade, $remarks, $grade_level, $status, $user_id]);
            $details = "Added new SHS grades for student ID $student_id in subject ID $subject_id";
            echo json_encode(['status' => 'success', 'message' => 'SHS grades saved successfully']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid assigned level']);
        exit;
    }

    // ✅ Audit trail logging
    if (!empty($details)) {
        $audit = $pdo->prepare("INSERT INTO audit_trail 
            (user_id, username, role, action, details, ip_address, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $audit->execute([$user_id, $username, $role, $action, $details, $ip]);
    }

} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
