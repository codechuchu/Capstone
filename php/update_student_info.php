<?php
session_start();
header('Content-Type: application/json');

function debugLog($message) {
    $logFile = __DIR__ . '/debug.log';
    file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
}

debugLog("=== NEW REQUEST START ===");
debugLog("Session ID: " . session_id());

$rawInput = file_get_contents('php://input');
debugLog("Raw POST input: " . $rawInput);

$data = json_decode($rawInput, true);
$jsonError = json_last_error();
if ($jsonError !== JSON_ERROR_NONE) {
    debugLog("JSON Decode Error: " . json_last_error_msg($jsonError));
    echo json_encode(["success" => false, "message" => "Invalid JSON payload: " . json_last_error_msg($jsonError)]);
    exit;
}

debugLog("Parsed data: " . var_export($data, true));

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

$user_id  = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? 'unknown';
$role     = $_SESSION['role'] ?? 'unknown';

debugLog("Extracted - applicant_id: '$applicant_id', level: '$level'");

if (empty($applicant_id) || empty($level)) {
    echo json_encode(["success" => false, "message" => "ID and level are required"]);
    debugLog("=== REQUEST END (ERROR) ===");
    exit;
}

if (!is_numeric($applicant_id) || $applicant_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid applicant ID"]);
    exit;
}

if (!empty($cellphone) && !preg_match('/^\d{11}$/', $cellphone)) {
    echo json_encode(["success" => false, "message" => "Cellphone must be exactly 11 digits"]);
    exit;
}

if (!empty($email) && (!filter_var($email, FILTER_VALIDATE_EMAIL) || !str_contains($email, '.com'))) {
    echo json_encode(["success" => false, "message" => "Invalid email"]);
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

        $fields = [];
        $values = [];

        if (isset($data['firstname'])) { $fields[] = "firstname = ?"; $values[] = $firstname; }
        if (isset($data['lastname'])) { $fields[] = "lastname = ?"; $values[] = $lastname; }
        if (isset($data['strand'])) { $fields[] = "strand = ?"; $values[] = $strand; }
        if (isset($data['grade_level'])) { $fields[] = "grade_level = ?"; $values[] = $grade_level; }
        if (isset($data['semester'])) { $fields[] = "semester = ?"; $values[] = $semester; }
        if (isset($data['barangay'])) { $fields[] = "barangay = ?"; $values[] = $barangay; }
        if (isset($data['municipal_city'])) { $fields[] = "municipal_city = ?"; $values[] = $municipal_city; }
        if (isset($data['province'])) { $fields[] = "province = ?"; $values[] = $province; }
        if (isset($data['cellphone'])) { $fields[] = "cellphone = ?"; $values[] = $cellphone; }
        if (isset($data['emailaddress'])) { $fields[] = "emailaddress = ?"; $values[] = $email; }

        if (empty($fields)) {
            echo json_encode(["success" => false, "message" => "No fields to update."]);
            debugLog("=== REQUEST END (NO FIELDS) ===");
            exit;
        }

        $values[] = (int)$applicant_id;
        $stmt = $pdo->prepare("UPDATE $table SET " . implode(", ", $fields) . " WHERE applicant_id = ?");
        $stmt->execute($values);

        $rowsAffected = $stmt->rowCount();
        debugLog("SHS Update: rowsAffected=$rowsAffected for applicant_id=$applicant_id");

    } else {
        $table = "jhs_applicants";

        $fields = [];
        $values = [];

        if (isset($data['firstname'])) { $fields[] = "firstname = ?"; $values[] = $firstname; }
        if (isset($data['lastname'])) { $fields[] = "lastname = ?"; $values[] = $lastname; }
        if (isset($data['grade_level'])) { $fields[] = "grade_level = ?"; $values[] = $grade_level; }
        if (isset($data['barangay'])) { $fields[] = "barangay = ?"; $values[] = $barangay; }
        if (isset($data['municipal_city'])) { $fields[] = "municipal_city = ?"; $values[] = $municipal_city; }
        if (isset($data['province'])) { $fields[] = "province = ?"; $values[] = $province; }
        if (isset($data['cellphone'])) { $fields[] = "cellphone = ?"; $values[] = $cellphone; }
        if (isset($data['emailaddress'])) { $fields[] = "emailaddress = ?"; $values[] = $email; }

        if (empty($fields)) {
            echo json_encode(["success" => false, "message" => "No fields to update."]);
            debugLog("=== REQUEST END (NO FIELDS) ===");
            exit;
        }

        $values[] = (int)$applicant_id;
        $stmt = $pdo->prepare("UPDATE $table SET " . implode(", ", $fields) . " WHERE applicant_id = ?");
        $stmt->execute($values);

        $rowsAffected = $stmt->rowCount();
        debugLog("JHS Update: rowsAffected=$rowsAffected for applicant_id=$applicant_id");
    }

    if ($rowsAffected === 0) {
        echo json_encode(["success" => false, "message" => "No student found or no changes were made."]);
        debugLog("=== REQUEST END (NO ROWS AFFECTED) ===");
        exit;
    }

    // ✅ Insert into audit trail
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $action = "Update Student Info";
    $details = "Updated student record (ID: $applicant_id, Level: $level)";

    $audit_sql = "INSERT INTO audit_trail (user_id, username, role, action, details, ip_address, timestamp)
                  VALUES (:user_id, :username, :role, :action, :details, :ip_address, NOW())";
    $audit_stmt = $pdo->prepare($audit_sql);
    $audit_stmt->execute([
        ':user_id' => $user_id,
        ':username' => $username,
        ':role' => $role,
        ':action' => $action,
        ':details' => $details,
        ':ip_address' => $ip_address
    ]);

    echo json_encode(["success" => true, "message" => "Student info updated successfully"]);
    debugLog("=== REQUEST END (SUCCESS) ===");

} catch (PDOException $e) {
    debugLog("PDO Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    debugLog("General Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
