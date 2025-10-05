<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
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
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}

function sanitize($str) {
    return htmlspecialchars(trim($str));
}

// -------------------------
// Applicant Info
// -------------------------
$lrn        = sanitize($_POST['lrn'] ?? '');
$gradeLevel = sanitize($_POST['grade_level'] ?? '');
$strand     = sanitize($_POST['strand'] ?? '');
$semester   = !empty($_POST['semester']) ? (($_POST['semester'] == "2") ? 2 : 1) : null;

$firstName  = sanitize($_POST['first_name'] ?? '');
$middleName = sanitize($_POST['middle_name'] ?? '');
$lastName   = sanitize($_POST['last_name'] ?? '');
$suffix     = sanitize($_POST['suffix'] ?? '');
$gender     = sanitize($_POST['gender'] ?? '');
$birthdate  = !empty($_POST['birth_date']) ? date('Y-m-d', strtotime($_POST['birth_date'])) : null;
$street     = sanitize($_POST['street_house'] ?? '');
$barangay   = sanitize($_POST['barangay'] ?? '');
$city       = sanitize($_POST['municipal_city'] ?? '');
$province   = sanitize($_POST['province'] ?? '');
$mobile     = sanitize($_POST['cellphone'] ?? '');
$email      = sanitize($_POST['emailaddress'] ?? '');

// -------------------------
// Guardian Info
// -------------------------
$gFirst     = sanitize($_POST['guardian_first_name'] ?? '');
$gMiddle    = sanitize($_POST['guardian_middle_name'] ?? '');
$gLast      = sanitize($_POST['guardian_last_name'] ?? '');
$gSuffix    = sanitize($_POST['guardian_suffix'] ?? '');
$gContact   = sanitize($_POST['guardian_contact'] ?? '');
$gEmail     = sanitize($_POST['guardian_email'] ?? '');
$gRelation  = sanitize($_POST['guardian_relation'] ?? '');

// -------------------------
// Determine tables
// -------------------------
if (empty($strand)) {
    // JHS
    $applicantTable = "jhs_applicants";
    $guardianTable  = "jhs_applicant_guardians";
    $docTable       = "jhs_applicant_documents";
    $isSHS = false;
} else {
    // SHS
    $applicantTable = "shs_applicant";
    $guardianTable  = "shs_applicant_guardians";
    $docTable       = "shs_applicant_documents";
    $isSHS = true;
}

try {
    $pdo->beginTransaction();

    // -------------------------
    // Insert Applicant
    // -------------------------
    if ($isSHS) {
        $stmt = $pdo->prepare("INSERT INTO {$applicantTable}
            (lrn, grade_level, strand, semester, firstname, middlename, lastname, suffix, gender,
             birth_date, street_house, barangay, municipal_city, province, cellphone, emailaddress, status)
             VALUES
            (:lrn, :grade, :strand, :semester, :fname, :mname, :lname, :suffix, :gender,
             :bdate, :street, :barangay, :city, :province, :cell, :email, 'enrolled')");
        $stmt->execute([
            ':lrn' => $lrn,
            ':grade' => $gradeLevel,
            ':strand' => $strand,
            ':semester' => $semester,
            ':fname' => $firstName,
            ':mname' => $middleName,
            ':lname' => $lastName,
            ':suffix' => $suffix,
            ':gender' => $gender,
            ':bdate' => $birthdate,
            ':street' => $street,
            ':barangay' => $barangay,
            ':city' => $city,
            ':province' => $province,
            ':cell' => $mobile,
            ':email' => $email
        ]);
    } else {
        // JHS – no strand, no semester
        $stmt = $pdo->prepare("INSERT INTO {$applicantTable}
            (lrn, grade_level, firstname, middlename, lastname, suffix, gender,
             birth_date, street_house, barangay, municipal_city, province, cellphone, emailaddress, status)
             VALUES
            (:lrn, :grade, :fname, :mname, :lname, :suffix, :gender,
             :bdate, :street, :barangay, :city, :province, :cell, :email, 'enrolled')");
        $stmt->execute([
            ':lrn' => $lrn,
            ':grade' => $gradeLevel,
            ':fname' => $firstName,
            ':mname' => $middleName,
            ':lname' => $lastName,
            ':suffix' => $suffix,
            ':gender' => $gender,
            ':bdate' => $birthdate,
            ':street' => $street,
            ':barangay' => $barangay,
            ':city' => $city,
            ':province' => $province,
            ':cell' => $mobile,
            ':email' => $email
        ]);
    }

    $applicantId = $pdo->lastInsertId();

    // -------------------------
    // Insert Guardian
    // -------------------------
    $stmt = $pdo->prepare("INSERT INTO {$guardianTable}
        (applicant_id, firstname, middlename, lastname, suffix, cellphone, email, relationship)
        VALUES
        (:id, :fname, :mname, :lname, :suffix, :cell, :email, :rel)");
    $stmt->execute([
        ':id' => $applicantId,
        ':fname' => $gFirst,
        ':mname' => $gMiddle,
        ':lname' => $gLast,
        ':suffix' => $gSuffix,
        ':cell' => $gContact,
        ':email' => $gEmail,
        ':rel' => $gRelation
    ]);

    // -------------------------
    // Documents
    // -------------------------
    $uploadDir = __DIR__ . "/uploads/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    function handleDocument($field, $checkbox, $uploadDir) {
        if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
            $tmp = $_FILES[$field]['tmp_name'];
            $name = basename($_FILES[$field]['name']);
            $safeName = preg_replace("/[^a-zA-Z0-9_\.-]/", "_", $name);
            $newName = time() . "_" . $safeName;
            $dest = $uploadDir . $newName;
            if (move_uploaded_file($tmp, $dest)) return "uploads/" . $newName;
        }
        if (isset($_POST[$checkbox])) return "submitted";
        return "submitted";
    }

    $birthCert = handleDocument("birth_certificate", "birthCertSubmitted", $uploadDir);
    $form138   = handleDocument("original_form_138", "form138Submitted", $uploadDir);
    $goodMoral = handleDocument("good_moral", "goodMoralSubmitted", $uploadDir);
    $form137   = handleDocument("original_form_137", "form137Submitted", $uploadDir);

    $stmt = $pdo->prepare("INSERT INTO {$docTable}
        (applicant_id, birth_certificate, original_form_138, good_moral, original_form_137)
        VALUES
        (:id, :bc, :f138, :gm, :f137)");
    $stmt->execute([
        ':id' => $applicantId,
        ':bc' => $birthCert,
        ':f138' => $form138,
        ':gm' => $goodMoral,
        ':f137' => $form137
    ]);

    // -------------------------
    // Students & Parents
    // -------------------------
    $studentPassword = $lastName . "123";
    $stmt = $pdo->prepare("INSERT INTO students (student_id, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$applicantId, $email, $studentPassword]);

    if (!empty($gFirst) && !empty($gLast)) {
        $parentPassword = $gLast . "123";
        $stmt = $pdo->prepare("INSERT INTO parents (student_id, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$applicantId, $gFirst, $gLast, $gEmail, $parentPassword]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Student enrolled successfully."]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
