<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Login check
    if (!isset($_SESSION['assigned_level'])) {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        // Check teachers table
        $stmt = $pdo->prepare("SELECT *, 'teacher' AS role FROM teachers WHERE email = ?");
        $stmt->execute([$email]);
        $userData = $stmt->fetch();

        // If not found, check admins table
        if (!$userData) {
            $stmt = $pdo->prepare("SELECT *, 'admin' AS role FROM admin WHERE email = ?");
            $stmt->execute([$email]);
            $userData = $stmt->fetch();
        }

        if (!$userData) {
            echo json_encode(['error' => 'No account found with that email.']);
            exit;
        }

        // Password check
        if ($password !== $userData['password']) {
            echo json_encode(['error' => 'Invalid password.']);
            exit;
        }

        // Store session
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['email'] = $userData['email'];
        $_SESSION['assigned_level'] = $userData['assigned_level'];
        $_SESSION['role'] = $userData['role'];
    }

    // Assigned level check
    $assigned_level = strtolower(trim($_SESSION['assigned_level']));

    if ($assigned_level === 'junior high') {
        $stmt = $pdo->prepare("
            SELECT applicant_id, '' AS strand, grade_level, 
                   CONCAT_WS(' ', firstname, middlename, lastname, suffix) AS name, 
                   cellphone, emailaddress 
            FROM jhs_applicants 
            WHERE LOWER(status) = 'enrolled'
        ");
    } elseif ($assigned_level === 'senior high') {
        $stmt = $pdo->prepare("
            SELECT applicant_id, strand, grade_level, 
                   CONCAT_WS(' ', firstname, middlename, lastname, suffix) AS name, 
                   cellphone, emailaddress 
            FROM shs_applicant 
            WHERE LOWER(status) = 'enrolled'
        ");
    } else {
        echo json_encode(['error' => 'Invalid assigned level: ' . $_SESSION['assigned_level']]);
        exit;
    }

    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode($rows);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
