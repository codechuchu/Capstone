<?php
session_start();
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ✅ Load PHPMailer manually (no Composer)
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

    $studentId = $applicant['applicant_id']; // assuming LRN
    $email     = $applicant['emailaddress'];
    $password  = $applicant['lastname'] . "123"; // plain password

    // Insert into students table
    $insert = $pdo->prepare("INSERT INTO students (student_id, email, password) VALUES (?, ?, ?)");
    $insert->execute([$studentId, $email, $password]);

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
    }

    // Update applicant status
    $update = $pdo->prepare("UPDATE $applicantTable SET status = 'enrolled' WHERE applicant_id = ?");
    $update->execute([$id]);

    // ✅ Send Email to applicant
    $mail = new PHPMailer(true);

    try {
        // SMTP settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'onionknight418@gmail.com';     // your Gmail
        $mail->Password   = 'lmke ipfx oqnq zbpk';          // <-- Replace with Google App Password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('onionknight418@gmail.com', 'Sulivan NHS');
        $mail->addAddress($email); // applicant email from DB

        if (!empty($guardian['email'])) {
            $mail->addCC($guardian['email']); // also send to guardian if email exists
        }

        // Prepare student full name
        $studentName = $applicant['firstname'] . ' ' . $applicant['lastname'];
        $portalURL = "https://sulivannhs.edu.ph/portal"; // replace with your actual portal URL
        $passwordFormatted = strtolower($applicant['lastname']) . "." . $studentId; // lastname.lowercase + "." + LRN

        // Email Content
        $mail->isHTML(true);
        $mail->Subject = 'Enrollment Confirmation';
        $mail->Body    = "
            <p>Dear {$studentName},</p>

            <p>We are pleased to inform you that you have been successfully enrolled at <b>Sulivan National High School</b> for the upcoming academic year.</p>

            <p>You may now access your Student Portal to view your enrollment details, class schedule, and other important academic information.</p>

            <p>📌 <b>Portal Login Details:</b></p>
            <p>
                Portal Link: <a href='{$portalURL}'>{$portalURL}</a><br>
                Username: {$email}<br>
                Password: {$passwordFormatted}
            </p>

            <p>🔐 For your security, please change your password upon first login.</p>

            <p>If you have any questions or encounter any issues accessing your account, feel free to contact the school directly.</p>

            <p>Thank you, and welcome to <b>Sulivan National High School</b>!</p>

            <p>Best regards,<br>
            Sulivan National High School</p>
        ";

        $mail->send();
        echo json_encode(["success" => true, "email_sent" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => true, "email_sent" => false, "error" => $mail->ErrorInfo]);
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
