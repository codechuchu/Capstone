<?php
session_start();
header('Content-Type: application/json');

// Function to log for debugging (creates debug.log in the same folder)
function debugLog($message) {
    $logFile = __DIR__ . '/debug.log';
    file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
}

debugLog("=== NEW REQUEST START ===");
debugLog("Session ID: " . session_id());  // To check if session is active

// Get raw input
$rawInput = file_get_contents('php://input');
debugLog("Raw POST input: " . $rawInput);

// Decode JSON
$data = json_decode($rawInput, true);
$jsonError = json_last_error();
if ($jsonError !== JSON_ERROR_NONE) {
    debugLog("JSON Decode Error: " . json_last_error_msg($jsonError));
    echo json_encode(["success" => false, "message" => "Invalid JSON payload: " . json_last_error_msg($jsonError)]);
    exit;
}

debugLog("Parsed data: " . var_export($data, true));  // Full dump of received data

// Extract and sanitize fields
$applicant_id = trim($data['applicant_id'] ?? '');
$firstname = trim(htmlspecialchars($data['firstname'] ?? ''));
$lastname = trim(htmlspecialchars($data['lastname'] ?? ''));
$strand = trim(htmlspecialchars($data['strand'] ?? ''));
$grade_level = trim(htmlspecialchars($data['grade_level'] ?? ''));
$semester = trim(htmlspecialchars($data['semester'] ?? ''));
$barangay = trim(htmlspecialchars($data['barangay'] ?? ''));
$municipal_city = trim(htmlspecialchars($data['municipal_city'] ?? ''));
$province = trim(htmlspecialchars($data['province'] ?? ''));
$cellphone = trim(htmlspecialchars($data['cellphone'] ?? ''));
$email = trim(htmlspecialchars($data['emailaddress'] ?? ''));
$level = trim($data['level'] ?? '');

debugLog("Extracted - applicant_id: '$applicant_id', level: '$level'");

if (empty($applicant_id) || empty($level)) {
    debugLog("ERROR: Missing required fields - applicant_id empty: " . (empty($applicant_id) ? 'YES' : 'NO') . ", level empty: " . (empty($level) ? 'YES' : 'NO'));
    echo json_encode(["success" => false, "message" => "ID and level are required. Received ID: '$applicant_id', Level: '$level'"]);
    debugLog("=== REQUEST END (ERROR) ===");
    exit;
}

// Validate applicant_id is numeric (assuming it's an integer in DB)
if (!is_numeric($applicant_id) || $applicant_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid applicant ID: must be a positive number"]);
    debugLog("=== REQUEST END (INVALID ID) ===");
    exit;
}

// Validate cellphone
if (!preg_match('/^\d{11}$/', $cellphone)) {
    echo json_encode(["success" => false, "message" => "Cellphone must be exactly 11 digits"]);
    debugLog("=== REQUEST END (CELLPHONE ERROR) ===");
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !str_contains($email, '.com')) {
    echo json_encode(["success" => false, "message" => "Invalid email"]);
    debugLog("=== REQUEST END (EMAIL ERROR) ===");
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
    debugLog("DB Connection successful");

    if (strtolower($level) === "senior high") {
        $table = "shs_applicant";

        // Validate strand for SHS (only if provided)
        if (!empty($strand)) {
            $stmtStrand = $pdo->query("SELECT DISTINCT strand FROM $table");
            $validStrands = $stmtStrand->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array($strand, $validStrands)) {
                echo json_encode(["success" => false, "message" => "Invalid strand. Must match an existing strand."]);
                debugLog("=== REQUEST END (STRAND ERROR) ===");
                exit;
            }
        }

        // Update SHS
        $stmt = $pdo->prepare("
            UPDATE $table SET 
                firstname = ?, lastname = ?, strand = ?, grade_level = ?, 
                semester = ?, barangay = ?, municipal_city = ?, province = ?, 
                cellphone = ?, emailaddress = ?
            WHERE applicant_id = ?
        ");
        $stmt->execute([$firstname, $lastname, $strand, $grade_level, $semester, $barangay, $municipal_city, $province, $cellphone, $email, (int)$applicant_id]);

        $rowsAffected = $stmt->rowCount();
        debugLog("SHS Update: rowsAffected=$rowsAffected for applicant_id=$applicant_id");

        if ($rowsAffected === 0) {
            echo json_encode(["success" => false, "message" => "No student found with that ID in the Senior High table or no changes were made."]);
            debugLog("=== REQUEST END (NO ROWS AFFECTED) ===");
            exit;
        }

    } else {
        $table = "jhs_applicants";

        // Update JHS
        $stmt = $pdo->prepare("
            UPDATE $table SET 
                firstname = ?, lastname = ?, grade_level = ?, 
                barangay = ?, municipal_city = ?, province = ?, 
                cellphone = ?, emailaddress = ?
            WHERE applicant_id = ?
        ");
        $stmt->execute([$firstname, $lastname, $grade_level, $barangay, $municipal_city, $province, $cellphone, $email, (int)$applicant_id]);

        $rowsAffected = $stmt->rowCount();
        debugLog("JHS Update: rowsAffected=$rowsAffected for applicant_id=$applicant_id");

        if ($rowsAffected === 0) {
            echo json_encode(["success" => false, "message" => "No student found with that ID in the Junior High table or no changes were made."]);
            debugLog("=== REQUEST END (NO ROWS AFFECTED) ===");
            exit;
        }
    }

    echo json_encode(["success" => true, "message" => "Student info updated successfully"]);
    debugLog("=== REQUEST END (SUCCESS) ===");

} catch (PDOException $e) {
    debugLog("PDO Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    debugLog("=== REQUEST END (DB ERROR) ===");
} catch (Throwable $e) {
    debugLog("General Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
    debugLog("=== REQUEST END (GENERAL ERROR) ===");
}
?>
