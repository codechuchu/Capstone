<?php
session_start();
header('Content-Type: application/json');

// DB
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

    if (!isset($_SESSION['assigned_level'])) {
        echo json_encode(["error" => "Not logged in or assigned level missing"]);
        exit;
    }

    // Read params
    $input = [];
    if (($_SERVER['CONTENT_TYPE'] ?? '') === 'application/json') {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
    }

    $grade    = trim($input['grade']  ?? $_GET['grade']  ?? $_POST['grade']  ?? '');
    $strand   = trim($input['strand'] ?? $_GET['strand'] ?? $_POST['strand'] ?? '');
    $semester = trim($input['semester'] ?? $_GET['semester'] ?? $_POST['semester'] ?? '');

    if ($grade === '') {
        echo json_encode(["error" => "Missing grade level"]);
        exit;
    }

    $assigned_level = strtolower(trim($_SESSION['assigned_level']));

    if ($assigned_level === 'senior high') {
        if ($strand === '') {
            echo json_encode(["error" => "Missing strand for Senior High"]);
            exit;
        }

        $query = "
            SELECT 
                applicant_id,
                CONCAT(firstname, ' ', lastname, IF(suffix <> '', CONCAT(' ', suffix), '')) AS name,
                cellphone AS contact_number,
                emailaddress AS email
            FROM shs_applicant
            WHERE LOWER(strand) = LOWER(?)
              AND grade_level = ?
              AND LOWER(status) = 'enrolled'
              AND section_id IS NULL
        ";

        $params = [$strand, $grade];

        // Only add semester filter if provided and valid (as string)
        if ($semester === "1" || $semester === "2") {
            $query .= " AND semester = ?";
            $params[] = $semester; // keep as string
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

    } elseif ($assigned_level === 'junior high') {

        $stmt = $pdo->prepare("
            SELECT 
                applicant_id,
                CONCAT(firstname, ' ', lastname, IF(suffix <> '', CONCAT(' ', suffix), '')) AS name,
                cellphone AS contact_number,
                emailaddress AS email
            FROM jhs_applicants
            WHERE grade_level = ?
              AND LOWER(status) = 'enrolled'
              AND section_id IS NULL
        ");
        $stmt->execute([$grade]);

    } else {
        echo json_encode(["error" => "Invalid assigned level"]);
        exit;
    }

    echo json_encode($stmt->fetchAll());

} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
