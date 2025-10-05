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

    // If not logged in yet, do a quick login check
    if (!isset($_SESSION['assigned_level'])) {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        // Try teachers first
        $stmt = $pdo->prepare("SELECT *, 'teacher' AS role FROM teachers WHERE email = ?");
        $stmt->execute([$email]);
        $userData = $stmt->fetch();

        // If not found, try admin
        if (!$userData) {
            $stmt = $pdo->prepare("SELECT *, 'admin' AS role FROM admin WHERE email = ?");
            $stmt->execute([$email]);
            $userData = $stmt->fetch();
        }

        if (!$userData) {
            echo json_encode(['error' => 'No account found with that email.']);
            exit;
        }

        if ($password !== $userData['password']) {
            echo json_encode(['error' => 'Invalid password.']);
            exit;
        }

        // Save session data
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['email'] = $userData['email'];
        $_SESSION['assigned_level'] = $userData['assigned_level'];
        $_SESSION['role'] = $userData['role'];
    }

    // Check assigned level
    $assigned_level = strtolower(trim($_SESSION['assigned_level']));

    // Determine dropdown visibility
    if ($assigned_level === 'senior high') {
        $response = [
            'assigned_level' => $_SESSION['assigned_level'],
            'dropdown' => 'SHS'
        ];
    } elseif ($assigned_level === 'junior high') {
        $response = [
            'assigned_level' => $_SESSION['assigned_level'],
            'dropdown' => 'JHS'
        ];
    } else {
        echo json_encode(['error' => 'Invalid assigned level: ' . $_SESSION['assigned_level']]);
        exit;
    }

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
