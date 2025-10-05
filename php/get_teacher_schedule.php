<?php
// Ensure session cookie path matches login
session_set_cookie_params([
    'path' => '/capstone/',  // must match your login cookie path exactly
    'httponly' => true,
    'secure' => false,       // true if using HTTPS
    'samesite' => 'Lax'
]);
session_start();

header('Content-Type: application/json');

// Debug: check session
// error_log('SESSION DATA: ' . print_r($_SESSION, true));

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in as teacher
if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'teachers') {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in as a teacher."
    ]);
    exit();
}

$teacher_id = intval($_SESSION['user_id']);

// Database connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}
$conn->set_charset("utf8mb4");

try {
    // Fetch teacher schedules
    $stmt = $conn->prepare("
        SELECT 
            cs.schedule_id,
            cs.day_of_week,
            cs.time_start,
            cs.time_end,
            sl.section_name,
            sub.name AS subject_name
        FROM class_schedules cs
        LEFT JOIN sections_list sl ON cs.section_id = sl.section_id
        LEFT JOIN subjects sub ON cs.subject_id = sub.subject_id
        WHERE cs.teacher_id = ?
        ORDER BY cs.day_of_week, cs.time_start
    ");

    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

    $stmt->bind_param("i", $teacher_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $schedules = [];
    while ($row = $result->fetch_assoc()) {
        $schedules[] = $row;
    }

    echo json_encode([
        "success" => true,
        "schedules" => $schedules,
        "message" => count($schedules) > 0 ? "Schedule fetched successfully." : "No schedules found for this teacher."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
exit();
