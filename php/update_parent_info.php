<?php
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Set charset
//$conn->set_charset($charset);

try {
    $data = json_decode(file_get_contents("php://input"), true);

    $parent_email  = $data['parent_email'] ?? null;
    $firstname     = $data['firstname'] ?? null;
    $lastname      = $data['lastname'] ?? null;
    $irn           = $data['lrn'] ?? null;
    $email         = $data['email'] ?? null;
    $password_val  = $data['password'] ?? null;
    $student_name  = $data['student'] ?? null;

    // ✅ Use proper session data
    $user_id  = $_SESSION['user_id'] ?? null;
    $username = $_SESSION['username'] ?? $_SESSION['email'] ?? 'unknown';
    $role     = $_SESSION['role'] ?? 'unknown';

    if (!$parent_email) {
        echo json_encode(['success' => false, 'message' => 'Parent identifier is required']);
        exit;
    }

    $student_id = null;
    if ($student_name) {
        $names = explode(' ', $student_name, 2);
        $first = $names[0];
        $last  = $names[1] ?? '';

        $stmt = $conn->prepare("
            SELECT applicant_id FROM jhs_applicants WHERE firstname = ? AND lastname = ?
            UNION
            SELECT applicant_id FROM shs_applicant WHERE firstname = ? AND lastname = ?
        ");
        $stmt->bind_param("ssss", $first, $last, $first, $last);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $student_id = $row['applicant_id'];
        } else {
            echo json_encode(['success' => false, 'message' => 'Student not found']);
            exit;
        }
        $stmt->close();
    }

    $updates = [];
    $params = [];
    $types = "";

    if ($firstname !== null) {
        $updates[] = "firstname = ?";
        $params[] = $firstname;
        $types .= "s";
    }
    if ($lastname !== null) {
        $updates[] = "lastname = ?";
        $params[] = $lastname;
        $types .= "s";
    }
    if ($irn !== null) {
        $updates[] = "lrn = ?";
        $params[] = $irn;
        $types .= "s";
    }
    if ($email !== null) {
        $updates[] = "email = ?";
        $params[] = $email;
        $types .= "s";
    }
    if ($password_val !== null) {
        $updates[] = "password = ?";
        $params[] = $password_val;
        $types .= "s";
    }
    if ($student_id !== null) {
        $updates[] = "student_id = ?";
        $params[] = $student_id;
        $types .= "i";
    }

    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'No changes detected']);
        exit;
    }

    $sql = "UPDATE parents SET " . implode(", ", $updates) . " WHERE email = ?";
    $params[] = $parent_email;
    $types .= "s";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        $ip_address = $_SERVER['REMOTE_ADDR'];
        $action = "Update Parent Info";
        $details = "Updated parent record for email: $parent_email";

        $audit_sql = "INSERT INTO audit_trail (user_id, username, role, action, details, ip_address, timestamp)
                      VALUES (?, ?, ?, ?, ?, ?, NOW())";
        $audit_stmt = $conn->prepare($audit_sql);
        $audit_stmt->bind_param("isssss", $user_id, $username, $role, $action, $details, $ip_address);
        $audit_stmt->execute();
        $audit_stmt->close();

        echo json_encode(['success' => true, 'message' => 'Parent updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed: ' . $conn->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'PHP error: ' . $e->getMessage()]);
    exit;
}
?>
