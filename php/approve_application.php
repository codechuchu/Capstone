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
    include_once __DIR__ . '/log_audit.php';

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

    // Insert student record
    $insert = $pdo->prepare("INSERT INTO students (student_id, email, password) VALUES (?, ?, ?)");
    $insert->execute([$studentId, $email, $password]);

    // Log
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', "Enrolled Student", "Student ID: $studentId added with email: $email");
    $logConn->close();

    // Fetch guardian
    $guardianStmt = $pdo->prepare("SELECT firstname, lastname, email FROM $guardianTable WHERE applicant_id = ?");
    $guardianStmt->execute([$studentId]);
    $guardian = $guardianStmt->fetch();

    $guardianEmail = '';
    $guardianPassword = '';

    if ($guardian) {
        $guardianFirstName = $guardian['firstname'];
        $guardianLastName  = $guardian['lastname'];
        $guardianEmail     = $guardian['email'];
        $guardianPassword  = $guardianLastName . "123";

        // Insert parent
        $insertParent = $pdo->prepare("INSERT INTO parents (student_id, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)");
        $insertParent->execute([$studentId, $guardianFirstName, $guardianLastName, $guardianEmail, $guardianPassword]);

        // Log
        $logConn = new mysqli($host, $user, $pass, $db);
        logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', "Added Parent Account", "Parent email: $guardianEmail linked to Student ID: $studentId");
        $logConn->close();
    }

    // ---------- DETERMINE SCHOOL YEAR ----------
    $today = date('Y-m-d');
    $periodStmt = $pdo->query("
        SELECT * 
        FROM activation_periods 
        WHERE '$today' BETWEEN start_date AND end_date
        LIMIT 1
    ");
    $period = $periodStmt->fetch();

    if ($period) {
        $startYear = date('Y', strtotime($period['start_date']));
        $endYear   = date('Y', strtotime($period['end_date']));

        if ($startYear == $endYear) {
            $schoolYear = $startYear . '-' . ($startYear + 1);
        } else {
            $schoolYear = $startYear . '-' . $endYear;
        }
    } else {
        // fallback if no active period
        $year = date('Y');
        $month = date('n');
        if ($month >= 6) { 
            $schoolYear = $year . '-' . ($year + 1);
        } else {
            $schoolYear = ($year - 1) . '-' . $year;
        }
    }

    // Update applicant status and add school_year
    $update = $pdo->prepare("
        UPDATE $applicantTable 
        SET status = 'enrolled', school_year = ? 
        WHERE applicant_id = ?
    ");
    $update->execute([$schoolYear, $id]);

    // Log
    $logConn = new mysqli($host, $user, $pass, $db);
    logAction($logConn, $_SESSION['user_id'] ?? 0, $_SESSION['email'] ?? 'unknown', $_SESSION['role'] ?? 'unknown', "Updated Applicant Status", "Applicant ID: $id status set to enrolled for S.Y. $schoolYear");
    $logConn->close();

    // ---------- EMAIL CONFIG ----------
    function sendEmail($to, $subject, $body) {
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
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    $portalURL = "https://sulivannhs.com";

    // ---------- STUDENT EMAIL ----------
    $studentName = $applicant['firstname'] . ' ' . $applicant['lastname'];
    $studentPassword = $applicant['lastname'] . "123";
    $studentBody = "
        <p>Dear {$studentName},</p>
        <p>We are pleased to inform you that you have been successfully enrolled at <b>Sulivan National High School</b> for the upcoming academic year.</p>
        <p>📌 <b>Portal Login Details:</b></p>
        <p>
            Portal Link: <a href='{$portalURL}'>{$portalURL}</a><br>
            Username: {$email}<br>
            Password: {$studentPassword}
        </p>
        <p>🔐 Please change your password upon first login.</p>
        <p>Best regards,<br><b>Sulivan National High School</b></p>
    ";
    $studentSent = sendEmail($email, 'Enrollment Confirmation', $studentBody);

    // ---------- GUARDIAN EMAIL ----------
    $guardianSent = false;
    if (!empty($guardianEmail)) {
        $guardianName = $guardian['firstname'] . ' ' . $guardian['lastname'];
        $guardianBody = "
            <p>Dear {$guardianName},</p>
            <p>Your child <b>{$studentName}</b> has been successfully enrolled at <b>Sulivan National High School</b>.</p>
            <p>📌 <b>Parent/Guardian Portal Login Details:</b></p>
            <p>
                Portal Link: <a href='{$portalURL}'>{$portalURL}</a><br>
                Username: {$guardianEmail}<br>
                Password: {$guardianPassword}
            </p>
            <p>🔐 Please change your password upon first login.</p>
            <p>Best regards,<br><b>Sulivan National High School</b></p>
        ";
        $guardianSent = sendEmail($guardianEmail, 'Parent Portal Account Created', $guardianBody);
    }

    echo json_encode([
        "success" => true,
        "student_email_sent" => $studentSent,
        "guardian_email_sent" => $guardianSent
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
