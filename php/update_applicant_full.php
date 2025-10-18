<?php
session_start();
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'teachers') {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as teacher']);
    exit;
}
$teacher_id = $_SESSION['user_id'];

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

// Helper to sanitize input
function val($key) {
    return isset($_POST[$key]) ? trim($_POST[$key]) : null;
}

$applicant_id = isset($_POST['applicant_id']) ? intval($_POST['applicant_id']) : 0;
$level = isset($_POST['level']) ? trim($_POST['level']) : 'shs';
if (!$applicant_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing applicant_id']);
    exit;
}

$appTable = ($level === 'shs') ? 'shs_applicant' : 'jhs_applicants';
$guardTable = ($level === 'shs') ? 'shs_applicant_guardians' : 'jhs_applicant_guardians';
$docTable = ($level === 'shs') ? 'shs_applicant_documents' : 'jhs_applicant_documents';

// Verify applicant exists
$stmt = $conn->prepare("SELECT section_id FROM {$appTable} WHERE applicant_id = ?");
$stmt->bind_param("i", $applicant_id);
$stmt->execute();
$res = $stmt->get_result();
if (!$res || $res->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Applicant not found']);
    exit;
}
$appRow = $res->fetch_assoc();
$section_id = $appRow['section_id'] ?? null;
$stmt->close();

if (!$section_id) {
    echo json_encode(['status' => 'error', 'message' => 'Applicant has no section assigned']);
    exit;
}

// Confirm teacher is adviser
$secStmt = $conn->prepare("SELECT adviser FROM sections_list WHERE section_id = ?");
$secStmt->bind_param("i", $section_id);
$secStmt->execute();
$secRes = $secStmt->get_result();
$adviser = $secRes->fetch_assoc()['adviser'] ?? null;
$secStmt->close();

if (intval($adviser) !== intval($teacher_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorised']);
    exit;
}

// Begin transaction
$conn->begin_transaction();

try {
    if ($level === 'shs') {
        $grade_level = val('grade_level');
        $semester = val('semester');
        $strand = val('strand');
        $firstname = val('firstname');
        $middlename = val('middlename');
        $lastname = val('lastname');
        $suffix = val('suffix');
        $gender = val('gender');
        $birth_date = val('birth_date');
        $street_house = val('street_house');
        $barangay = val('barangay');
        $municipal_city = val('municipal_city');
        $province = val('province');
        $cellphone = val('cellphone');
        $emailaddress = val('emailaddress');
        $lrn = val('lrn');

        $sql = "UPDATE shs_applicant SET
            grade_level = ?, semester = ?, strand = ?, firstname = ?, middlename = ?, lastname = ?, suffix = ?,
            gender = ?, birth_date = ?, street_house = ?, barangay = ?, municipal_city = ?, province = ?,
            cellphone = ?, emailaddress = ?, lrn = ?
            WHERE applicant_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "sissssssssssssssi",
            $grade_level,
            $semester,
            $strand,
            $firstname,
            $middlename,
            $lastname,
            $suffix,
            $gender,
            $birth_date,
            $street_house,
            $barangay,
            $municipal_city,
            $province,
            $cellphone,
            $emailaddress,
            $lrn,
            $applicant_id
        );
    } else {
        $grade_level = val('grade_level');
        $firstname = val('firstname');
        $middlename = val('middlename');
        $lastname = val('lastname');
        $suffix = val('suffix');
        $gender = val('gender');
        $birth_date = val('birth_date');
        $street_house = val('street_house');
        $barangay = val('barangay');
        $municipal_city = val('municipal_city');
        $province = val('province');
        $cellphone = val('cellphone');
        $emailaddress = val('emailaddress');
        $lrn = val('lrn');

        $sql = "UPDATE jhs_applicants SET
            grade_level = ?, firstname = ?, middlename = ?, lastname = ?, suffix = ?,
            gender = ?, birth_date = ?, street_house = ?, barangay = ?, municipal_city = ?, province = ?,
            cellphone = ?, emailaddress = ?, lrn = ?
            WHERE applicant_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "issssssssssssi",
            $grade_level,
            $firstname,
            $middlename,
            $lastname,
            $suffix,
            $gender,
            $birth_date,
            $street_house,
            $barangay,
            $municipal_city,
            $province,
            $cellphone,
            $emailaddress,
            $lrn,
            $applicant_id
        );
    }

    $stmt->execute();
    $stmt->close();


    // Guardian section
    $g_first = val('g_firstname');
    $g_mid = val('g_middlename');
    $g_last = val('g_lastname');
    $g_suffix = val('g_suffix');
    $g_cell = val('g_cellphone');
    $g_email = val('g_email');
    $g_rel = val('g_relationship');

    $gCheck = $conn->prepare("SELECT guardian_id FROM {$guardTable} WHERE applicant_id = ?");
    $gCheck->bind_param("i", $applicant_id);
    $gCheck->execute();
    $gRes = $gCheck->get_result();

    if ($gRes && $gRes->num_rows > 0) {
        $gCheck->close();
        $gUpd = $conn->prepare("UPDATE {$guardTable} SET firstname=?, middlename=?, lastname=?, suffix=?, cellphone=?, email=?, relationship=? WHERE applicant_id=?");
        $gUpd->bind_param("sssssssi", $g_first, $g_mid, $g_last, $g_suffix, $g_cell, $g_email, $g_rel, $applicant_id);
        $gUpd->execute();
        $gUpd->close();
    } else {
        $gCheck->close();
        $gIns = $conn->prepare("INSERT INTO {$guardTable} (applicant_id, firstname, middlename, lastname, suffix, cellphone, email, relationship) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $gIns->bind_param("isssssss", $applicant_id, $g_first, $g_mid, $g_last, $g_suffix, $g_cell, $g_email, $g_rel);
        $gIns->execute();
        $gIns->close();
    }

    // Document uploads
    $uploadDir = __DIR__ . "/../uploads/documents/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $docCheck = $conn->prepare("SELECT * FROM {$docTable} WHERE applicant_id = ?");
    $docCheck->bind_param("i", $applicant_id);
    $docCheck->execute();
    $docRes = $docCheck->get_result();
    $currentDocs = $docRes->fetch_assoc() ?: [];
    $docCheck->close();

    $fileFields = ['birth_certificate', 'original_form_138', 'good_moral', 'original_form_137'];
    $newPaths = [];

    foreach ($fileFields as $field) {
        if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
            $orig = basename($_FILES[$field]['name']);
            $safe = preg_replace("/[^a-zA-Z0-9_\.-]/", "_", $orig);
            $newName = time() . "_{$field}_" . $safe;
            $dest = $uploadDir . $newName;
            if (move_uploaded_file($_FILES[$field]['tmp_name'], $dest)) {
                $newPaths[$field] = 'uploads/documents/' . $newName;
                if (!empty($currentDocs[$field]) && file_exists(__DIR__ . '/../' . $currentDocs[$field])) {
                    @unlink(__DIR__ . '/../' . $currentDocs[$field]);
                }
            } else {
                $newPaths[$field] = $currentDocs[$field] ?? null;
            }
        } else {
            $newPaths[$field] = $currentDocs[$field] ?? null;
        }
    }

    // Save document paths
    $checkDoc = $conn->prepare("SELECT document_id FROM {$docTable} WHERE applicant_id = ?");
    $checkDoc->bind_param("i", $applicant_id);
    $checkDoc->execute();
    $dr = $checkDoc->get_result();

    if ($dr && $dr->num_rows > 0) {
        $checkDoc->close();
        $updDoc = $conn->prepare("UPDATE {$docTable} SET birth_certificate=?, original_form_138=?, good_moral=?, original_form_137=? WHERE applicant_id=?");
        $updDoc->bind_param("ssssi", $newPaths['birth_certificate'], $newPaths['original_form_138'], $newPaths['good_moral'], $newPaths['original_form_137'], $applicant_id);
        $updDoc->execute();
        $updDoc->close();
    } else {
        $checkDoc->close();
        $insDoc = $conn->prepare("INSERT INTO {$docTable} (applicant_id, birth_certificate, original_form_138, good_moral, original_form_137) VALUES (?, ?, ?, ?, ?)");
        $insDoc->bind_param("issss", $applicant_id, $newPaths['birth_certificate'], $newPaths['original_form_138'], $newPaths['good_moral'], $newPaths['original_form_137']);
        $insDoc->execute();
        $insDoc->close();
    }

    $conn->commit();
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
$conn->close();
?>
