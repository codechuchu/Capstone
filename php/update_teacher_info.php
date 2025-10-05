<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
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

    $teacher_id     = $data['teacher_id'] ?? null;
    $first_name     = $data['first_name'] ?? null;
    $middle_name    = $data['middle_name'] ?? null;
    $last_name      = $data['last_name'] ?? null;
    $assigned_level = $data['assigned_level'] ?? null;
    $subjects       = $data['subjects'] ?? null; // comma-separated subject names
    $email          = $data['email'] ?? null;
    $password_val   = $data['password'] ?? null;

    if (!$teacher_id) {
        echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
        exit;
    }

    // Fetch current teacher info
    $stmt = $conn->prepare("SELECT * FROM teachers WHERE teacher_id = ?");
    $stmt->bind_param("i", $teacher_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }
    $current_data = $result->fetch_assoc();
    $stmt->close();

    // Validate subjects & get their IDs
    $subject_ids = [];
    if ($subjects !== null) {
        $subject_array = array_filter(array_map('trim', explode(',', $subjects)));
        foreach ($subject_array as $subj_name) {
            $check_stmt = $conn->prepare("SELECT subject_id FROM subjects WHERE name = ?");
            $check_stmt->bind_param("s", $subj_name);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            if ($check_result->num_rows === 0) {
                echo json_encode(['success' => false, 'message' => "Invalid subject: $subj_name"]);
                exit;
            }
            $row = $check_result->fetch_assoc();
            $subject_ids[] = $row['subject_id']; // separate IDs for subject_id column
            $check_stmt->close();
        }
    }

    // Build update query dynamically
    $updates = [];
    $params = [];
    $types = "";

    if ($first_name !== null && $first_name !== $current_data['firstname']) {
        $updates[] = "firstname = ?";
        $params[] = $first_name;
        $types .= "s";
    }
    if ($middle_name !== null && $middle_name !== $current_data['middlename']) {
        $updates[] = "middlename = ?";
        $params[] = $middle_name;
        $types .= "s";
    }
    if ($last_name !== null && $last_name !== $current_data['lastname']) {
        $updates[] = "lastname = ?";
        $params[] = $last_name;
        $types .= "s";
    }
    if ($assigned_level !== null && $assigned_level !== $current_data['assigned_level']) {
        $updates[] = "assigned_level = ?";
        $params[] = $assigned_level;
        $types .= "s";
    }
    if ($subjects !== null) {
        $updates[] = "subjects = ?";
        $params[] = $subjects;
        $types .= "s";

        // Also update subject_id column as comma-separated IDs
        $updates[] = "subject_id = ?";
        $params[] = implode(',', $subject_ids);
        $types .= "s";
    }
    if ($email !== null && $email !== $current_data['email']) {
        $updates[] = "email = ?";
        $params[] = $email;
        $types .= "s";
    }
    if ($password_val !== null && $password_val !== $current_data['password']) {
        $updates[] = "password = ?";
        $params[] = $password_val;
        $types .= "s";
    }

    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'No changes detected']);
        exit;
    }

    $sql = "UPDATE teachers SET " . implode(", ", $updates) . " WHERE teacher_id = ?";
    $params[] = $teacher_id;
    $types .= "i";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Teacher info updated successfully']);
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
