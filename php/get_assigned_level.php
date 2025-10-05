<?php
// Set session cookie path properly
session_set_cookie_params([
    'path' => '/capstone/',
    'httponly' => true,
    'secure' => false,
    'samesite' => 'Lax'
]);
session_start();

header('Content-Type: application/json');

// Debug log for session
error_log('get_assigned_level.php SESSION: ' . print_r($_SESSION, true));

if (isset($_SESSION['assigned_level']) && !empty($_SESSION['assigned_level'])) {
    echo json_encode([
        "success" => true,
        "assigned_level" => $_SESSION['assigned_level']
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized. No assigned level in session."
    ]);
}
?>
