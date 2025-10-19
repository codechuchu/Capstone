<?php
session_start();
header('Content-Type: application/json');

// Show errors for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

$section_id = isset($_GET['section_id']) ? intval($_GET['section_id']) : 0;
$level = isset($_GET['level']) ? $_GET['level'] : '';

if (!$section_id || !$level) {
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

$results = [];

try {
    if ($level === "Junior High") {
        $sql = "
            SELECT 
                a.applicant_id AS student_id,
                CONCAT(a.firstname, ' ', a.lastname) AS student_name,
                s.subject_name AS subject_name,
                g.q1, g.q2, g.q3, g.q4, g.average
            FROM jhs_applicants a
            CROSS JOIN (
                SELECT s.subject_name
                FROM jhs_subjects s
                INNER JOIN studentgrade g2 ON g2.subject_id = s.subject_id AND g2.section_id = ?
                LIMIT 1
            ) s
            LEFT JOIN studentgrade g
                ON g.student_id = a.applicant_id AND g.section_id = ?
            WHERE a.section_id = ?
            ORDER BY a.lastname, a.firstname
        ";
    } elseif ($level === "Senior High") {
        $sql = "
            SELECT 
                a.applicant_id AS student_id,
                CONCAT(a.firstname, ' ', a.lastname) AS student_name,
                sub.name AS subject_name,
                g.q1_grade, g.q2_grade, g.final_grade
            FROM shs_applicant a
            CROSS JOIN (
                SELECT s.name
                FROM subjects s
                INNER JOIN class_schedules cs ON cs.subject_id = s.subject_id
                WHERE cs.section_id = ?
                LIMIT 1
            ) sub
            LEFT JOIN shs_studentgrade g
                ON g.student_id = a.applicant_id AND g.section_id = ?
            WHERE a.section_id = ?
            ORDER BY a.lastname, a.firstname
        ";
    } else {
        echo json_encode(["error" => "Invalid level"]);
        exit;
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("iii", $section_id, $section_id, $section_id);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $results[] = $row;
    }
    $stmt->close();

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
