<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

$section_id = isset($_GET['section_id']) ? intval($_GET['section_id']) : 0;
$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : 0;
$level = isset($_GET['level']) ? $_GET['level'] : '';

if (!$section_id || !$subject_id || !$level) {
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
                s.subject_name,
                g.q1, g.q2, g.q3, g.q4, g.average
            FROM jhs_applicants a
            LEFT JOIN studentgrade g 
                ON g.student_id = a.applicant_id 
                AND g.section_id = a.section_id
                AND g.subject_id = ?
            INNER JOIN jhs_subjects s 
                ON s.subject_id = ?
            WHERE a.section_id = ?
            ORDER BY a.lastname, a.firstname
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $subject_id, $subject_id, $section_id);

    } elseif ($level === "Senior High") {
        $sql = "
            SELECT 
                a.applicant_id AS student_id,
                CONCAT(a.firstname, ' ', a.lastname) AS student_name,
                a.strand,
                s.name AS subject_name,
                g.q1_grade, g.q2_grade, g.final_grade
            FROM shs_applicant a
            LEFT JOIN shs_studentgrade g 
                ON g.student_id = a.applicant_id 
                AND g.section_id = a.section_id
                AND g.subject_id = ?
            INNER JOIN subjects s 
                ON s.subject_id = ?
            WHERE a.section_id = ?
            ORDER BY a.lastname, a.firstname
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $subject_id, $subject_id, $section_id);

    } else {
        echo json_encode(["error" => "Invalid level"]);
        exit;
    }

    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $results[] = $row;
    }

    echo json_encode($results);
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
