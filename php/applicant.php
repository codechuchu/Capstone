<?php
file_put_contents("debug.log", print_r($_POST, true));
ini_set('display_errors', 1);
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

function saveBase64ToFile($base64Data, $uploadDir, $prefix) {
    $dataParts = explode(',', $base64Data);
    if (count($dataParts) === 2) {
        $decoded = base64_decode($dataParts[1]);
        $filename = $prefix . '_' . time() . '.bin';
        $filePath = $uploadDir . $filename;
        if (file_put_contents($filePath, $decoded) !== false) {
            return "uploads/" . $filename;
        }
    }
    return null;
}

// Get POST data
$gradeLevel = sanitize($_POST['grade_level'] ?? '');
$strand = sanitize($_POST['track'] ?? '');
$semester = isset($_POST['semester']) ? sanitize($_POST['semester']) : null;
if ($semester !== null && !in_array($semester, ['1','2'], true)) {
    $semester = null; // only allow '1' or '2'
}

$lrn = sanitize($_POST['lrn'] ?? ''); // <-- Added LRN

$firstName = sanitize($_POST['first_name'] ?? '');
$middleName = sanitize($_POST['middle_name'] ?? '');
$lastName = sanitize($_POST['last_name'] ?? '');
$suffix = sanitize($_POST['suffix'] ?? '');
$gender = sanitize($_POST['gender'] ?? '');
$birthdate = !empty($_POST['birthdate']) ? date('Y-m-d', strtotime($_POST['birthdate'])) : null;
$streetHouse = sanitize($_POST['street_house'] ?? '');
$barangay = sanitize($_POST['barangay'] ?? '');
$municipalCity = sanitize($_POST['municipal_city'] ?? '');
$province = sanitize($_POST['province'] ?? '');
$mobile = sanitize($_POST['cellphone'] ?? '');
$email = sanitize($_POST['emailaddress'] ?? '');

// Guardian data
$gFirstName = sanitize($_POST['guardian_first_name'] ?? '');
$gMiddleName = sanitize($_POST['guardian_middle_name'] ?? '');
$gLastName = sanitize($_POST['guardian_last_name'] ?? '');
$gSuffix = sanitize($_POST['guardian_suffix'] ?? '');
$guardianContact = sanitize($_POST['guardian_contact'] ?? '');
$guardianEmail = sanitize($_POST['guardian_email'] ?? '');
$guardianRelation = sanitize($_POST['guardian_relation'] ?? '');

// Determine table set based on strand
if (empty($strand)) {
    $applicantTable = "jhs_applicants";
    $guardianTable = "jhs_applicant_guardians";
    $documentsTable = "jhs_applicant_documents";
    $includeStrand = false;
} else {
    $applicantTable = "shs_applicant";
    $guardianTable = "shs_applicant_guardians";
    $documentsTable = "shs_applicant_documents";
    $includeStrand = true;
}

try {
    $pdo->beginTransaction();

    // Insert applicant
    if ($includeStrand) {
        $stmt = $pdo->prepare("INSERT INTO {$applicantTable} (
            grade_level, strand, semester, lrn, firstname, middlename, lastname, suffix, gender,
            birth_date, street_house, barangay, municipal_city, province,
            cellphone, emailaddress
        ) VALUES (
            :grade_level, :strand, :semester, :lrn, :firstname, :middlename, :lastname, :suffix, :gender,
            :birth_date, :street_house, :barangay, :municipal_city, :province,
            :cellphone, :emailaddress
        )");
        $stmt->execute([
            ':grade_level' => $gradeLevel,
            ':strand' => $strand,
            ':semester' => $semester,
            ':lrn' => $lrn,
            ':firstname' => $firstName,
            ':middlename' => $middleName,
            ':lastname' => $lastName,
            ':suffix' => $suffix,
            ':gender' => $gender,
            ':birth_date' => $birthdate,
            ':street_house' => $streetHouse,
            ':barangay' => $barangay,
            ':municipal_city' => $municipalCity,
            ':province' => $province,
            ':cellphone' => $mobile,
            ':emailaddress' => $email
        ]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO {$applicantTable} (
            grade_level, lrn, firstname, middlename, lastname, suffix, gender,
            birth_date, street_house, barangay, municipal_city, province,
            cellphone, emailaddress
        ) VALUES (
            :grade_level, :lrn, :firstname, :middlename, :lastname, :suffix, :gender,
            :birth_date, :street_house, :barangay, :municipal_city, :province,
            :cellphone, :emailaddress
        )");
        $stmt->execute([
            ':grade_level' => $gradeLevel,
            ':lrn' => $lrn,
            ':firstname' => $firstName,
            ':middlename' => $middleName,
            ':lastname' => $lastName,
            ':suffix' => $suffix,
            ':gender' => $gender,
            ':birth_date' => $birthdate,
            ':street_house' => $streetHouse,
            ':barangay' => $barangay,
            ':municipal_city' => $municipalCity,
            ':province' => $province,
            ':cellphone' => $mobile,
            ':emailaddress' => $email
        ]);
    }

    $applicantId = $pdo->lastInsertId();

    // Insert guardian
    $stmt = $pdo->prepare("INSERT INTO {$guardianTable} (
        applicant_id, firstname, middlename, lastname, suffix, cellphone, email, relationship
    ) VALUES (
        :applicant_id, :firstname, :middlename, :lastname, :suffix, :cellphone, :email, :relationship
    )");
    $stmt->execute([
        ':applicant_id' => $applicantId,
        ':firstname' => $gFirstName,
        ':middlename' => $gMiddleName,
        ':lastname' => $gLastName,
        ':suffix' => $gSuffix,
        ':cellphone' => $guardianContact,
        ':email' => $guardianEmail,
        ':relationship' => $guardianRelation
    ]);

    // File uploads
    $uploadDir = __DIR__ . "/uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileFields = ['birth_certificate', 'original_form_138', 'good_moral', 'original_form_137'];
    $filePaths = [];

    foreach ($fileFields as $field) {
        if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES[$field]['tmp_name'];
            $originalName = basename($_FILES[$field]['name']);
            $safeName = preg_replace("/[^a-zA-Z0-9_\.-]/", "_", $originalName);
            $newName = time() . '_' . $safeName;
            $destination = $uploadDir . $newName;
            if (move_uploaded_file($tmpName, $destination)) {
                $filePaths[$field] = "uploads/" . $newName;
            } else {
                if (!empty($_POST[$field])) {
                    $filePaths[$field] = saveBase64ToFile($_POST[$field], $uploadDir, $field);
                } else {
                    $filePaths[$field] = null;
                }
            }
        } elseif (!empty($_POST[$field])) {
            $filePaths[$field] = saveBase64ToFile($_POST[$field], $uploadDir, $field);
        } else {
            $filePaths[$field] = null;
        }
    }

    // Insert document paths
    $stmt = $pdo->prepare("INSERT INTO {$documentsTable} (
        applicant_id, birth_certificate, original_form_138, good_moral, original_form_137
    ) VALUES (
        :applicant_id, :birth_certificate, :original_form_138, :good_moral, :original_form_137
    )");
    $stmt->execute([
        ':applicant_id' => $applicantId,
        ':birth_certificate' => $filePaths['birth_certificate'],
        ':original_form_138' => $filePaths['original_form_138'],
        ':good_moral' => $filePaths['good_moral'],
        ':original_form_137' => $filePaths['original_form_137']
    ]);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Application submitted successfully."]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
