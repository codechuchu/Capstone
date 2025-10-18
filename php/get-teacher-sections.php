<?php
session_start();
header('Content-Type: application/json');

// Ensure teacher is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teachers') {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as teacher']);
    exit;
}

$teacher_id = $_SESSION['user_id'];

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// ✅ Fetch all sections assigned to this teacher and include adviser column
$sql = "
    SELECT section_id, section_name, strand, grade_level, adviser
    FROM sections_list
    WHERE FIND_IN_SET(?, teacher_ids)
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();

$sections = [];
while ($row = $result->fetch_assoc()) {
    $sections[] = [
        'section_id'   => $row['section_id'],
        'section_name' => $row['section_name'],
        'strand'       => $row['strand'],
        'grade_level'  => $row['grade_level'],
        'adviser'      => $row['adviser'] // ✅ Include this field for JS advisory check
    ];
}

echo json_encode([
    'status'   => 'success',
    'sections' => $sections
]);

$stmt->close();
$conn->close();
?>
