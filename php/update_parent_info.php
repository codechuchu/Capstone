<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"), true);

    $parent_email  = $data['parent_email'] ?? null; // identifier
    $firstname     = $data['firstname'] ?? null;
    $lastname      = $data['lastname'] ?? null;
    $irn           = $data['irn'] ?? null;
    $email         = $data['email'] ?? null;
    $password_val  = $data['password'] ?? null;
    $student_name  = $data['student'] ?? null;

    if (!$parent_email) {
        echo json_encode(['success' => false, 'message' => 'Parent identifier is required']);
        exit;
    }

    // Verify student exists
    $student_id = null;
    if ($student_name) {
        $names = explode(' ', $student_name, 2);
        $first = $names[0];
        $last  = $names[1] ?? '';
        
        $stmt = $conn->prepare("
            SELECT applicant_id FROM jhs_applicants WHERE firstname = ? AND lastname = ?
            UNION
            SELECT applicant_id FROM shs_applicants WHERE firstname = ? AND lastname = ?
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

    // Build update query dynamically
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
        $updates[] = "irn = ?";
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
