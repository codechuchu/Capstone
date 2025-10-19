<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB connect failed']);
    exit;
}

$section_id = intval($_GET['section_id'] ?? 0);
if ($section_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid section_id']);
    exit;
}

$sec_sql = "SELECT s.section_name, s.strand_id, s.grade_level, s.semester, s.assigned_level, st.strand 
            FROM sections_list s
            LEFT JOIN strand st ON s.strand_id = st.strand_id
            WHERE s.section_id = ?";
$stmt = $conn->prepare($sec_sql);
$stmt->bind_param("i", $section_id);
$stmt->execute();
$sec_result = $stmt->get_result();
$section = $sec_result->fetch_assoc();

if (!$section) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Section not found']);
    exit;
}

$assigned_level = strtolower($section['assigned_level']);
$subjects = [];

if ($assigned_level === 'senior high') {
    $strand_id = $section['strand_id'];
    $strand_abbr = $section['strand'];
    $grade = preg_replace('/[^0-9]/', '', $section['grade_level']); 
    $semester = $section['semester'];

    $pattern = '';
    if ($grade == '11' && $semester == '1') $pattern = $strand_abbr . '11%';
    elseif ($grade == '11' && $semester == '2') $pattern = $strand_abbr . '12%';
    elseif ($grade == '12' && $semester == '1') $pattern = $strand_abbr . '21%';
    elseif ($grade == '12' && $semester == '2') $pattern = $strand_abbr . '22%';

    $sql = "SELECT subject_id, name, subcode 
            FROM subjects 
            WHERE strand_id = ? AND subcode LIKE ?
            ORDER BY subcode ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $strand_id, $pattern);
    $stmt->execute();
    $res = $stmt->get_result();

    while ($row = $res->fetch_assoc()) {
        $subjects[] = $row;
    }

} elseif ($assigned_level === 'junior high') {
    $sql = "SELECT subject_id, subject_name AS name FROM jhs_subjects ORDER BY subject_name ASC";
    $res = $conn->query($sql);
    while ($row = $res->fetch_assoc()) {
        $subjects[] = $row;
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Unknown assigned level']);
    exit;
}

echo json_encode(['status' => 'success', 'subjects' => $subjects]);
exit;
?>
