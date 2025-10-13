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
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "No applicant id provided"]);
        exit;
    }

    // fetch JHS applicant info
    $stmt = $pdo->prepare("SELECT applicant_id, lastname, emailaddress FROM jhs_applicants WHERE applicant_id = ?");
    $stmt->execute([$id]);
    $applicant = $stmt->fetch();

    if (!$applicant) {
        echo json_encode(["error" => "Applicant not found"]);
        exit;
    }

    $studentId = $applicant['applicant_id'];
    $email = $applicant['emailaddress'];
    $password = $applicant['lastname'] . "123"; // plain password

    // insert into students
    $insert = $pdo->prepare("INSERT INTO students (student_id, email, password) VALUES (?, ?, ?)");
    $insert->execute([$studentId, $email, $password]);

    // -----------------
    // Audit log for student
    include_once __DIR__ . '/log_audit.php';
    $action = "Enrolled Student";
    $details = "Student ID: $studentId added with email: $email";
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
    $logConn->close();
    // -----------------

    // fetch guardian info from jhs_applicant_guardians
    $guardianStmt = $pdo->prepare("SELECT firstname, lastname, email FROM jhs_applicant_guardians WHERE applicant_id = ?");
    $guardianStmt->execute([$studentId]);
    $guardian = $guardianStmt->fetch();

    if ($guardian) {
        $guardianFirstName = $guardian['firstname'];
        $guardianLastName = $guardian['lastname'];
        $guardianEmail = $guardian['email'];
        $guardianPassword = $guardianLastName . "123";

        // insert into parents table
        $insertParent = $pdo->prepare("INSERT INTO parents (student_id, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)");
        $insertParent->execute([$studentId, $guardianFirstName, $guardianLastName, $guardianEmail, $guardianPassword]);

        // -----------------
        // Audit log for parent
        $action = "Added Parent Account";
        $details = "Parent email: $guardianEmail linked to Student ID: $studentId";
        $logConn = new mysqli($host, $user, $pass, $db);
        logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
        $logConn->close();
        // -----------------
    }

    // update applicant status
    $update = $pdo->prepare("UPDATE jhs_applicants SET status = 'enrolled' WHERE applicant_id = ?");
    $update->execute([$id]);

    // -----------------
    // Audit log for applicant status
    $action = "Updated Applicant Status";
    $details = "Applicant ID: $id status set to enrolled";
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
    $logConn->close();
    // -----------------

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
