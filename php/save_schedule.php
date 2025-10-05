<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Database connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Read JSON input
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

if (!$data || empty($data['section_id']) || !is_array($data['schedules'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid section or schedule data', 'received' => $data]);
    exit;
}

$section_id = intval($data['section_id']);
$schedules = $data['schedules'];

// === NEW: Delete all schedules for this section before inserting ===
$deleteStmt = $conn->prepare("DELETE FROM class_schedules WHERE section_id = ?");
if ($deleteStmt) {
    $deleteStmt->bind_param("i", $section_id);
    $deleteStmt->execute();
    $deleteStmt->close();
}
// === END DELETE ===

// Prepare insert statement
$stmt = $conn->prepare("INSERT INTO class_schedules (section_id, subject_id, teacher_id, day_of_week, time_start, time_end) VALUES (?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare insert statement', 'error' => $conn->error]);
    exit;
}

// Function to check overlap (kept for possible future server-side checks)
function isOverlap($start1, $end1, $start2, $end2) {
    return (strtotime($start1) < strtotime($end2) && strtotime($end1) > strtotime($start2));
}

$conflicts = [];

foreach ($schedules as $index => $s) {
    $subject_id = intval($s['subject_id']);
    $teacher_id = intval($s['teacher_id']);
    $day_of_week = $s['day_of_week'];
    $time_start = date("H:i:s", strtotime($s['time_start']));
    $time_end = date("H:i:s", strtotime($s['time_end']));

    $checkSql = "SELECT section_id, subject_id, teacher_id, day_of_week, time_start, time_end 
                 FROM class_schedules
                 WHERE teacher_id = ? AND day_of_week = ? 
                       AND ((time_start < ? AND time_end > ?) 
                        OR (time_start < ? AND time_end > ?) 
                        OR (time_start >= ? AND time_end <= ?))";

    $checkStmt = $conn->prepare($checkSql);
    if (!$checkStmt) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to prepare conflict check statement', 'error' => $conn->error]);
        exit;
    }

    $checkStmt->bind_param(
        "isssssss",
        $teacher_id,
        $day_of_week,
        $time_end, $time_start,
        $time_end, $time_start,
        $time_start, $time_end
    );
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result && $result->num_rows > 0) {
        // Fetch subject name and teacher full name using prepared statements.
        $subjectName = "";
        $teacherName = "";

        $subjectStmt = $conn->prepare("SELECT name FROM subjects WHERE subject_id = ? LIMIT 1");
        if ($subjectStmt) {
            $subjectStmt->bind_param("i", $subject_id);
            $subjectStmt->execute();
            $subjectStmt->bind_result($subjectNameResult);
            if ($subjectStmt->fetch()) {
                $subjectName = $subjectNameResult;
            }
            $subjectStmt->close();
        }

        $teacherStmt = $conn->prepare("SELECT CONCAT(firstname, ' ', lastname) AS teacher_name FROM teachers WHERE teacher_id = ? LIMIT 1");
        if ($teacherStmt) {
            $teacherStmt->bind_param("i", $teacher_id);
            $teacherStmt->execute();
            $teacherStmt->bind_result($teacherNameResult);
            if ($teacherStmt->fetch()) {
                $teacherName = $teacherNameResult;
            }
            $teacherStmt->close();
        }

        $conflicts[] = [
            'row_index'   => $index,
            'subject_id'  => $subject_id,
            'subject_name'=> $subjectName,
            'teacher_id'  => $teacher_id,
            'teacher_name'=> $teacherName,
            'day_of_week' => $day_of_week,
            'time_start'  => $time_start,
            'time_end'    => $time_end
        ];

        $checkStmt->close();
        continue;
    }

    if ($checkStmt) $checkStmt->close();

    $stmt->bind_param("iiisss", $section_id, $subject_id, $teacher_id, $day_of_week, $time_start, $time_end);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to insert schedule', 'error' => $stmt->error]);
        exit;
    }
}

// ✅ Update teacher_ids in sections_list (merge instead of overwrite)

// Collect teacher IDs from schedules
$teacherIds = array_map(function($s) {
    return intval($s['teacher_id']);
}, $schedules);

// Fetch existing teacher_ids from sections_list
$existingIds = [];
$fetchStmt = $conn->prepare("SELECT teacher_ids FROM sections_list WHERE section_id = ? LIMIT 1");
if ($fetchStmt) {
    $fetchStmt->bind_param("i", $section_id);
    $fetchStmt->execute();
    $fetchStmt->bind_result($teacherIdsStrExisting);
    if ($fetchStmt->fetch() && !empty($teacherIdsStrExisting)) {
        $existingIds = array_map('intval', explode(',', $teacherIdsStrExisting));
    }
    $fetchStmt->close();
}

// Merge and deduplicate
$allTeacherIds = array_unique(array_merge($existingIds, $teacherIds));
$teacherIdsStr = implode(',', $allTeacherIds);

// Update sections_list with merged teacher_ids
$updateStmt = $conn->prepare("UPDATE sections_list SET teacher_ids = ? WHERE section_id = ?");
if ($updateStmt) {
    $updateStmt->bind_param("si", $teacherIdsStr, $section_id);
    $updateStmt->execute();
    $updateStmt->close();
}

if (!empty($conflicts)) {
    http_response_code(409); // Conflict
    echo json_encode([
        'status' => 'error',
        'message' => 'Conflict detected! Some schedules were not saved.',
        'conflicts' => $conflicts
    ]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Schedules saved successfully']);
$stmt->close();
$conn->close();
?>