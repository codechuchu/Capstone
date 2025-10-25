<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    if (!isset($_GET['teacher_id']) || empty($_GET['teacher_id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing teacher_id']);
        exit;
    }

    $teacher_id = $_GET['teacher_id'];

    // Fetch teacher name
    $teacherRes = $conn->prepare("SELECT firstname, middlename, lastname FROM teachers WHERE teacher_id = ?");
    $teacherRes->bind_param("i", $teacher_id);
    $teacherRes->execute();
    $teacherData = $teacherRes->get_result()->fetch_assoc();
    $teacher_name = $teacherData ? trim($teacherData['firstname'] . ' ' . ($teacherData['middlename'] ?? '') . ' ' . $teacherData['lastname']) : "Unknown Teacher";

    // 1️⃣ Find all sections where this teacher is assigned
    $stmt = $conn->prepare("
        SELECT section_id, section_name, grade_level, strand 
        FROM sections_list 
        WHERE FIND_IN_SET(?, teacher_ids)
    ");
    $stmt->bind_param("s", $teacher_id);
    $stmt->execute();
    $sections_result = $stmt->get_result();

    $sections = [];

    while ($row = $sections_result->fetch_assoc()) {
        $section_id = $row['section_id'];

        // 2️⃣ Fetch only subjects that this teacher (encoded_by) teaches in this section
        $subject_stmt = $conn->prepare("
            SELECT DISTINCT s.name 
            FROM shs_studentgrade sg
            JOIN subjects s ON s.subject_id = sg.subject_id
            WHERE sg.section_id = ? AND sg.encoded_by = ?
        ");
        $subject_stmt->bind_param("ii", $section_id, $teacher_id);
        $subject_stmt->execute();
        $subject_res = $subject_stmt->get_result();

        $subjects = [];
        while ($sub = $subject_res->fetch_assoc()) {
            $subjects[] = $sub['name'];
        }
        $subject_stmt->close();

        if (!empty($subjects)) {
            $sections[] = [
                'section_id' => $section_id,
                'section_name' => $row['section_name'],
                'grade_level' => $row['grade_level'],
                'strand' => $row['strand'],
                'subjects' => $subjects,
                'teacher_name' => $teacher_name  // ✅ add teacher name here
            ];
        }
    }

    echo json_encode(['success' => true, 'sections' => $sections]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
