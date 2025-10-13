<?php
// -------------------------
// log_audit.php
// -------------------------

// Function to log actions
function logAction($conn, $user_id, $username, $role, $action, $details) {
    if (!$conn) return false;

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $stmt = $conn->prepare("INSERT INTO audit_trail (user_id, username, role, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $user_id, $username, $role, $action, $details, $ip);
    $stmt->execute();
    $stmt->close();
}

// -------------------------
// Optional: standalone logging endpoint
// Only runs if this file is called directly (POST request)
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json');
    session_start();

    $conn = new mysqli("localhost", "root", "", "sulivannhs");
    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed"]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = $_SESSION['user_id'] ?? 0;
    $username = $_SESSION['email'] ?? 'unknown';
    $role = $_SESSION['role'] ?? 'unknown';
    $action = $data['action'] ?? 'Undefined Action';
    $details = $data['details'] ?? '';

    logAction($conn, $user_id, $username, $role, $action, $details);

    echo json_encode(["success" => true, "message" => "Audit log recorded successfully."]);
    $conn->close();
}
?>
