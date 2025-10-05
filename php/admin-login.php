<?php
// Ensure cookies work for /capstone/ folder
session_set_cookie_params([
    'path' => '/capstone/',  // Make sure this matches your project folder
    'httponly' => true,
    'secure' => false,       // set to true if using HTTPS
    'samesite' => 'Lax'
]);
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "Sulivannhs2025", "sulivannhs");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$email = $_POST['username'] ?? '';
$pass  = $_POST['password'] ?? '';

$tables = [
    "admin"    => "admin-profile.html",
    "parents"  => "parent-profile.html",
    "students" => "student-profile.html",
    "teachers" => "teacher-profile.html"
];

foreach ($tables as $table => $redirect) {
    // Prepare SQL with assigned_level only for teachers and admin
    if ($table === "teachers" || $table === "admin") {
        $sql = "SELECT *, assigned_level FROM $table WHERE email = ? AND password = ?";
    } else {
        $sql = "SELECT * FROM $table WHERE email = ? AND password = ?";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        exit();
    }

    $stmt->bind_param("ss", $email, $pass);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();

        switch ($table) {
            case "students":
                $_SESSION['user_id'] = $user['student_id'];
                break;
            case "teachers":
                $_SESSION['user_id'] = $user['teacher_id'];
                $_SESSION['assigned_level'] = $user['assigned_level'] ?? null;
                break;
            case "admin":
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['assigned_level'] = $user['assigned_level'] ?? null;
                break;
            default:
                $_SESSION['user_id'] = $user['id'];
                break;
        }

        $_SESSION['role']  = $table;
        $_SESSION['email'] = $user['email'];
        session_write_close(); // Save session data

        $response = [
            "success" => true,
            "redirect" => "../ui/$redirect",
            "role" => $table,
            "user_id" => $_SESSION['user_id']
        ];

        // Add assigned_level to response if available
        if (isset($_SESSION['assigned_level'])) {
            $response['assigned_level'] = $_SESSION['assigned_level'];
        }

        echo json_encode($response);

        $stmt->close();
        $conn->close();
        exit();
    }

    $stmt->close();
}

$conn->close();
echo json_encode(["success" => false, "message" => "Invalid username or password."]);
exit();
