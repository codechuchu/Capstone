<?php
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/approve_error.log');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../PHPMailer-master/src/Exception.php';
require __DIR__ . '/../PHPMailer-master/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer-master/src/SMTP.php';

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error) {
        file_put_contents(__DIR__ . '/approve_error.log', "[FATAL] " . print_r($error, true), FILE_APPEND);
    }
});

if (!isset($_SESSION['assigned_level'])) {
    echo json_encode(["error" => "Assigned level not set in session"]);
    exit;
}


// ✅ XAMPP credentials 
$host = 'localhost';
$db = 'sulivannhs'; 
$user = 'root'; 
$pass = ''; 
$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    include_once __DIR__ . '/log_audit.php';

    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "No applicant id provided"]);
        exit;
    }

    // Determine tables
    if ($_SESSION['assigned_level'] === 'Senior High') {
        $applicantTable = 'shs_applicant';
        $guardianTable  = 'shs_applicant_guardians';
    } else {
        $applicantTable = 'jhs_applicants';
        $guardianTable  = 'jhs_applicant_guardians';
    }

    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Fetch applicant ID $id\n", FILE_APPEND);

// --- Fetch applicant details ---
$stmt = $pdo->prepare("SELECT applicant_id, lrn, firstname, lastname, emailaddress FROM $applicantTable WHERE applicant_id = ?");
$stmt->execute([$id]);
$applicant = $stmt->fetch();

if (!$applicant) {
    echo json_encode(["error" => "Applicant not found"]);
    exit;
}

// ✅ Use the actual LRN (not applicant_id)
$lrn = trim($applicant['lrn']);
$email = $applicant['emailaddress'];
$password = $applicant['lastname'] . "123";
$assignedLevel = $_SESSION['assigned_level'] ?? null;

if (!$assignedLevel) {
    echo json_encode(["error" => "Assigned level missing"]);
    exit;
}

if (empty($lrn)) {
    file_put_contents(__DIR__ . '/approve_error.log', "[ERROR] Missing LRN for applicant ID {$id}\n", FILE_APPEND);
    echo json_encode(["error" => "Missing LRN for applicant"]);
    exit;
}

// --- Insert or update student record (using applicant_id as student_id) ---
$checkStudent = $pdo->prepare("SELECT student_id FROM students WHERE student_id = ?");
$checkStudent->execute([$id]);
$existingStudent = $checkStudent->fetch();

if (!$existingStudent) {
    $insertStudent = $pdo->prepare("
        INSERT INTO students (student_id, email, password, assigned_level)
        VALUES (?, ?, ?, ?)
    ");
    $insertStudent->execute([$id, $email, $password, $assignedLevel]);
    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Student inserted with applicant_id: {$id} and level: {$assignedLevel}\n", FILE_APPEND);
} else {
    $updateStudent = $pdo->prepare("UPDATE students SET assigned_level = ? WHERE student_id = ?");
    $updateStudent->execute([$assignedLevel, $id]);
    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Student already exists, updated applicant_id: {$id} with level: {$assignedLevel}\n", FILE_APPEND);
}


// --- Fetch guardian ---
$guardianStmt = $pdo->prepare("SELECT firstname, lastname, email FROM $guardianTable WHERE applicant_id = ?");
$guardianStmt->execute([$id]);
$guardian = $guardianStmt->fetch();

try {
    if ($guardian) {
        $guardianFirstName = $guardian['firstname'];
        $guardianLastName  = $guardian['lastname'];
        $guardianEmail     = trim($guardian['email']);
        $guardianPassword  = $guardianLastName . "123";

        if (!empty($guardianEmail) && filter_var($guardianEmail, FILTER_VALIDATE_EMAIL)) {
            // Check if parent already exists
            $checkParent = $pdo->prepare("SELECT id, lrn FROM parents WHERE email = ?");
            $checkParent->execute([$guardianEmail]);
            $existingParent = $checkParent->fetch();

            if ($existingParent) {
                // Append LRN if not already included
                $lrnList = !empty($existingParent['lrn']) ? explode(',', $existingParent['lrn']) : [];
                if (!in_array($lrn, $lrnList)) {
                    $lrnList[] = $lrn;
                    $updatedLrn = implode(',', $lrnList);
                    $updateParent = $pdo->prepare("UPDATE parents SET lrn = ? WHERE id = ?");
                    $updateParent->execute([$updatedLrn, $existingParent['id']]);
                    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Added LRN {$lrn} to existing parent {$guardianEmail}\n", FILE_APPEND);
                } else {
                    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] LRN {$lrn} already linked to parent {$guardianEmail}\n", FILE_APPEND);
                }
            } else {
                // Insert new parent record
                $insertParent = $pdo->prepare("
                    INSERT INTO parents (lrn, firstname, lastname, email, password)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $insertParent->execute([$lrn, $guardianFirstName, $guardianLastName, $guardianEmail, $guardianPassword]);
                file_put_contents(__DIR__ . '/approve_error.log', "[STEP] New parent created: {$guardianEmail} with LRN {$lrn}\n", FILE_APPEND);
            }
        } else {
            file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Invalid or empty guardian email: {$guardianEmail}\n", FILE_APPEND);
        }
    } else {
        file_put_contents(__DIR__ . '/approve_error.log', "[STEP] No guardian found for applicant ID {$id}\n", FILE_APPEND);
    }
} catch (Exception $e) {
    file_put_contents(__DIR__ . '/approve_error.log', "[GUARDIAN ERROR] " . $e->getMessage() . "\n", FILE_APPEND);
}

    // Determine school year
    $today = date('Y-m-d');
    $periodStmt = $pdo->query("SELECT * FROM activation_periods WHERE '$today' BETWEEN start_date AND end_date LIMIT 1");
    $period = $periodStmt->fetch();
    $schoolYear = '';
    if ($period) {
        $startYear = date('Y', strtotime($period['start_date']));
        $endYear   = date('Y', strtotime($period['end_date']));
        $schoolYear = ($startYear == $endYear) ? $startYear . '-' . ($startYear + 1) : $startYear . '-' . $endYear;
    } else {
        $year = date('Y');
        $month = date('n');
        $schoolYear = ($month >= 6) ? $year . '-' . ($year + 1) : ($year - 1) . '-' . $year;
    }
    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Determined school year: $schoolYear\n", FILE_APPEND);

    // Update applicant status
    $update = $pdo->prepare("UPDATE $applicantTable SET status = 'enrolled', school_year = ? WHERE applicant_id = ?");
    $update->execute([$schoolYear, $id]);
    file_put_contents(__DIR__ . '/approve_error.log', "[STEP] Applicant status updated: $id\n", FILE_APPEND);

    // Email sending function
    function sendEmail($to, $subject, $body)
    {
        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
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
            file_put_contents(__DIR__ . '/approve_error.log', "[EMAIL ERROR] $to : " . $e->getMessage() . "\n", FILE_APPEND);
            return false;
        }
    }

    $portalURL = "https://sulivannhs.com";
    $studentName = $applicant['firstname'] . ' ' . $applicant['lastname'];
    $studentBody = <<<HTML
<p>Dear {$studentName},</p>
<p>We are pleased to inform you that you have been successfully enrolled at <b>Sulivan National High School</b> for the upcoming academic year.</p>
<p><b>Portal Login Details:</b></p>
<p>Portal Link: <a href="{$portalURL}">{$portalURL}</a><br>
Username: {$email}<br>
Password: {$password}</p>
<p>🔐 Please change your password upon first login.</p>
<p>Best regards,<br><b>Sulivan National High School</b></p>
HTML;


    $studentSent = sendEmail($email, 'Enrollment Confirmation', $studentBody);

    $guardianSent = false;
    if (!empty($guardianEmail)) {
        $guardianName = $guardian['firstname'] . ' ' . $guardian['lastname'];
        $guardianBody = <<<HTML
<p>Dear {$guardianName},</p>
<p>Your child <b>{$studentName}</b> has been successfully enrolled at <b>Sulivan National High School</b>.</p>
<p><b>Parent/Guardian Portal Login Details:</b></p>
<p>Portal Link: <a href="{$portalURL}">{$portalURL}</a><br>
Username: {$guardianEmail}<br>
Password: {$guardianPassword}</p>
<p>🔐 Please change your password upon first login.</p>
<p>Best regards,<br><b>Sulivan National High School</b></p>
HTML;

        $guardianSent = sendEmail($guardianEmail, 'Parent Portal Account Created', $guardianBody);
    }

    echo json_encode([
        "success" => true,
        "student_email_sent" => $studentSent,
        "guardian_email_sent" => $guardianSent
    ]);
} catch (Exception $e) {
    file_put_contents(__DIR__ . '/approve_error.log', "[EXCEPTION] " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(["error" => $e->getMessage()]);
}
