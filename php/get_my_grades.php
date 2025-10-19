<?php
session_start();
header('Content-Type: application/json');

// ✅ Enable debugging in XAMPP
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- Get student ID from URL (priority) or session
$student_id = $_GET['student_id'] ?? ($_SESSION['user_id'] ?? null);

if (!$student_id) {
    echo json_encode(["error" => "No student_id provided or student not logged in"]);
    exit;
}

try {
    // ✅ XAMPP connection settings
    $host = 'localhost';
    $db   = 'sulivannhs';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // --- Check if SHS ---
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM shs_studentgrade WHERE student_id = ?");
    $stmt->execute([$student_id]);
    $shs_count = (int)$stmt->fetchColumn();

    // --- Check if JHS ---
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM studentgrade WHERE student_id = ?");
    $stmt->execute([$student_id]);
    $jhs_count = (int)$stmt->fetchColumn();

    // Debug info (so you can confirm what’s found)
    $debug_info = [
        "student_id" => $student_id,
        "shs_count" => $shs_count,
        "jhs_count" => $jhs_count
    ];

    if ($shs_count > 0) {
        $grade_level = "SHS";
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
    } elseif ($jhs_count > 0) {
        $grade_level = "JHS";
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
        unset($row);
    } else {
        echo json_encode([
            "status" => "success",
            "message" => "No grades found in either JHS or SHS tables.",
            "debug" => $debug_info
        ], JSON_PRETTY_PRINT);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "level" => $grade_level,
        "grades" => $grades,
        "debug" => $debug_info
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit;
}
?>
