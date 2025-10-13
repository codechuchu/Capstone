<?php
session_start();
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../PHPMailer-master/src/Exception.php';
require __DIR__ . '/../PHPMailer-master/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer-master/src/SMTP.php';

if (!isset($_SESSION['assigned_level'])) {
    echo json_encode(["error" => "Assigned level not set in session"]);
    exit;
}

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
    include_once __DIR__ . '/log_audit.php'; // Audit log functions

    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "No applicant id provided"]);
        exit;
    }

    // Determine table based on assigned level
    if ($_SESSION['assigned_level'] === 'Senior High') {
        $applicantTable = 'shs_applicant';
        $guardianTable  = 'shs_applicant_guardians';
    } else {
        $applicantTable = 'jhs_applicants';
        $guardianTable  = 'jhs_applicant_guardians';
    }

    // Fetch applicant info
    $stmt = $pdo->prepare("SELECT applicant_id, lastname, firstname, emailaddress FROM $applicantTable WHERE applicant_id = ?");
    $stmt->execute([$id]);
    $applicant = $stmt->fetch();

    if (!$applicant) {
        echo json_encode(["error" => "Applicant not found"]);
        exit;
    }

    $studentId = $applicant['applicant_id'];
    $email     = $applicant['emailaddress'];
    $password  = $applicant['lastname'] . "123";

    // Insert into students table
    $insert = $pdo->prepare("INSERT INTO students (student_id, email, password) VALUES (?, ?, ?)");
    $insert->execute([$studentId, $email, $password]);

    // Audit log: student added
    $action = "Enrolled Student";
    $details = "Student ID: $studentId added with email: $email";
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
    $logConn->close();

    // Fetch guardian info
    $guardianStmt = $pdo->prepare("SELECT firstname, lastname, email FROM $guardianTable WHERE applicant_id = ?");
    $guardianStmt->execute([$studentId]);
    $guardian = $guardianStmt->fetch();

    if ($guardian) {
        $guardianFirstName = $guardian['firstname'];
        $guardianLastName  = $guardian['lastname'];
        $guardianEmail     = $guardian['email'];
        $guardianPassword  = $guardianLastName . "123";

        // Insert into parents table
        $insertParent = $pdo->prepare(
            "INSERT INTO parents (student_id, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)"
        );
        $insertParent->execute([$studentId, $guardianFirstName, $guardianLastName, $guardianEmail, $guardianPassword]);

        // Audit log: parent added
        $action = "Added Parent Account";
        $details = "Parent email: $guardianEmail linked to Student ID: $studentId";
        $logConn = new mysqli($host, $user, $pass, $db);
        logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
        $logConn->close();
    }

    // Update applicant status
    $update = $pdo->prepare("UPDATE $applicantTable SET status = 'enrolled' WHERE applicant_id = ?");
    $update->execute([$id]);

    // Audit log: applicant status updated
    $action = "Updated Applicant Status";
    $details = "Applicant ID: $id status set to enrolled";
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
    $logConn->close();

    // Send Email to applicant
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'onionknight418@gmail.com';
        $mail->Password   = 'lmke ipfx oqnq zbpk';
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('onionknight418@gmail.com', 'Sulivan NHS');
        $mail->addAddress($email);
        if (!empty($guardian['email'])) $mail->addCC($guardian['email']);

        $studentName = $applicant['firstname'] . ' ' . $applicant['lastname'];
        $portalURL = "https://sulivannhs.edu.ph/portal";
        $passwordFormatted = strtolower($applicant['lastname']) . "." . $studentId;

        $mail->isHTML(true);
        $mail->Subject = 'Enrollment Confirmation';
        $mail->Body    = "
            <p>Dear {$studentName},</p>
            <p>You have been successfully enrolled at <b>Sulivan National High School</b>.</p>
            <p>Portal Login: <a href='{$portalURL}'>{$portalURL}</a><br>
               Username: {$email}<br>
               Password: {$passwordFormatted}</p>
            <p>🔐 Please change your password upon first login.</p>
        ";

        $mail->send();

        // Audit log: email sent
        $action = "Sent Enrollment Email";
        $details = "Email sent to student: $email (Guardian: {$guardian['email']})";
        $logConn = new mysqli($host, $user, $pass, $db);
        logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
        $logConn->close();

        echo json_encode(["success" => true, "email_sent" => true]);

    } catch (Exception $e) {
        echo json_encode(["success" => true, "email_sent" => false, "error" => $mail->ErrorInfo]);
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
