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

    $found = false;
    $basePath = "/capstone/php/";

    // First try SHS
    $stmt = $pdo->prepare("
        SELECT strand, firstname, middlename, lastname, suffix, gender, birth_date,
               street_house, barangay, municipal_city, province, cellphone, emailaddress
        FROM shs_applicant
        WHERE applicant_id = ?
    ");
    $stmt->execute([$id]);
    $applicant = $stmt->fetch();

    if ($applicant) {
        $found = true;

        if (empty($applicant['strand'])) {
            $applicant['strand'] = "N/A";
        }

        $stmt = $pdo->prepare("
            SELECT firstname, middlename, lastname, suffix, cellphone, email, relationship
            FROM shs_applicant_guardians
            WHERE applicant_id = ?
        ");
        $stmt->execute([$id]);
        $guardians = $stmt->fetchAll();

        $stmt = $pdo->prepare("
            SELECT birth_certificate, original_form_138, good_moral, original_form_137
            FROM shs_applicant_documents
            WHERE applicant_id = ?
        ");
        $stmt->execute([$id]);
        $documents = $stmt->fetch();
    }

    // If not found in SHS, try JHS
    if (!$found) {
        $stmt = $pdo->prepare("
            SELECT NULL AS strand, firstname, middlename, lastname, suffix, gender, birth_date,
                   street_house, barangay, municipal_city, province, cellphone, emailaddress
            FROM jhs_applicants
            WHERE applicant_id = ?
        ");
        $stmt->execute([$id]);
        $applicant = $stmt->fetch();

        if ($applicant) {
            $found = true;
            $applicant['strand'] = "N/A"; // ensure strand is always present

            $stmt = $pdo->prepare("
                SELECT firstname, middlename, lastname, suffix, cellphone, email, relationship
                FROM jhs_applicant_guardians
                WHERE applicant_id = ?
            ");
            $stmt->execute([$id]);
            $guardians = $stmt->fetchAll();

            $stmt = $pdo->prepare("
                SELECT birth_certificate, original_form_138, good_moral, original_form_137
                FROM jhs_applicant_documents
                WHERE applicant_id = ?
            ");
            $stmt->execute([$id]);
            $documents = $stmt->fetch();
        }
    }

    if ($found) {
        // Prepend base path to files
        if ($documents) {
            foreach ($documents as $key => $file) {
                if (!empty($file)) {
                    $documents[$key] = $basePath . $file;
                }
            }
        }

        echo json_encode([
            "applicant" => $applicant,
            "guardians" => $guardians,
            "documents" => $documents
        ]);
    } else {
        echo json_encode(["error" => "Application not found in SHS or JHS tables"]);
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
