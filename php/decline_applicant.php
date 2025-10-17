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

    $applicant_id = $_POST['applicant_id'] ?? null;
    $reason       = $_POST['reason'] ?? '';

    if (!$applicant_id) {
        echo json_encode(["error" => "No applicant id provided"]);
        exit;
    }

    // Determine the correct tables based on assigned level
    if ($_SESSION['assigned_level'] === 'Senior High') {
        $applicantTable = 'shs_applicant';
        $guardianTable  = 'shs_applicant_guardians';
    } else {
        $applicantTable = 'jhs_applicants';
        $guardianTable  = 'jhs_applicant_guardians';
    }

    // Fetch applicant info
    $stmt = $pdo->prepare("SELECT applicant_id, firstname, lastname, emailaddress FROM $applicantTable WHERE applicant_id = ?");
    $stmt->execute([$applicant_id]);
    $applicant = $stmt->fetch();

    if (!$applicant) {
        echo json_encode(["error" => "Applicant not found"]);
        exit;
    }

    // Update applicant status and decline reason
    $update = $pdo->prepare("UPDATE $applicantTable SET status = 'declined', decline_reason = :reason WHERE applicant_id = :id");
    $update->execute([
        ':reason' => $reason,
        ':id' => $applicant_id
    ]);

    // Log action
    $action = "Declined Applicant";
    $details = "Applicant ID: {$applicant_id} was declined. Reason: {$reason}";
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', $action, $details);
    $logConn->close();

    // Fetch guardian info (if any)
    $guardianStmt = $pdo->prepare("SELECT email FROM $guardianTable WHERE applicant_id = ?");
    $guardianStmt->execute([$applicant_id]);
    $guardian = $guardianStmt->fetch();

    // Send decline email
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
        $mail->addAddress($applicant['emailaddress']);
        if (!empty($guardian['email'])) $mail->addCC($guardian['email']);

        $studentName = $applicant['firstname'] . ' ' . $applicant['lastname'];

        $mail->isHTML(true);
        $mail->Subject = 'Application Status Sulivan National High School';
        $mail->Body = "
            <p>Dear {$studentName},</p>
            <p>We regret to inform you that your application to <b>Sulivan National High School</b> has been <b>declined</b>.</p>
            <p><b>Reason for Decline:</b><br>{$reason}</p>
            <p>We appreciate your interest in our school and encourage you to reapply in the future should circumstances change.</p>
            <p>Thank you for your time and effort.<br><br>
            Best regards,<br>
            <b>Enrollment Office</b><br>
            Sulivan National High School</p>
        ";

        $mail->send();

        // Log email sent
        $action = "Sent Decline Email";
        $details = "Decline email sent to: {$applicant['emailaddress']}" . (!empty($guardian['email']) ? " (Guardian: {$guardian['email']})" : "");
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
