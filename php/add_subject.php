<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// ✅ Get assigned level from session
if (!isset($_SESSION['assigned_level'])) {
    echo json_encode(["success" => false, "message" => "No assigned level in session"]);
    exit;
}
$assigned_level = strtolower($_SESSION['assigned_level']);

// ✅ Get input data (JSON)
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "No input data"]);
    exit;
}

// =======================
// 🟢 Junior High Subjects
// =======================
if ($assigned_level === "junior high") {
    $name = trim($data["name"] ?? "");
    if ($name === "") {
        echo json_encode(["success" => false, "message" => "Subject name is required"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO jhs_subjects (subject_name) VALUES (?)");
    $stmt->bind_param("s", $name);

    if ($stmt->execute()) {

        // -----------------
        // Audit log
        include_once __DIR__ . '/log_audit.php';
        $action = "Added JHS Subject";
        $details = "Subject Name: $name";
        $logConn = new mysqli("localhost", "root", "", "sulivannhs");
        logAction($logConn, $_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'], $action, $details);
        $logConn->close();
        // -----------------

        echo json_encode(["success" => true, "message" => "Subject added successfully (JHS)"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add subject"]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

// =======================
// 🟡 Senior High Subjects
// =======================
if ($assigned_level === "senior high") {
    $subcode = strtoupper(trim($data["subcode"] ?? ""));
    $name = trim($data["name"] ?? "");

    if ($subcode === "" || $name === "") {
        echo json_encode(["success" => false, "message" => "Subcode and name are required"]);
        exit;
    }

    // Extract strand from subcode (letters only prefix)
    if (!preg_match('/^([A-Z ]+)[0-9]+$/', $subcode, $matches)) {
        echo json_encode(["success" => false, "message" => "Invalid subcode format"]);
        exit;
    }
    $strandName = trim($matches[1]);

    // Get strand_id from strands table
    $stmt = $conn->prepare("SELECT strand_id FROM strand WHERE UPPER(strand) = ?");
    $stmt->bind_param("s", $strandName);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Unknown strand: $strandName"]);
        exit;
    }

    $row = $res->fetch_assoc();
    $strand_id = $row["strand_id"];
    $stmt->close();

    // Insert into subjects
    $stmt = $conn->prepare("INSERT INTO subjects (strand_id, subcode, name) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $strand_id, $subcode, $name);

    if ($stmt->execute()) {

        // -----------------
        // Audit log
        include_once __DIR__ . '/log_audit.php';
        $action = "Added SHS Subject";
        $details = "Strand: $strandName, Subcode: $subcode, Name: $name";
        $logConn = new mysqli("localhost", "root", "", "sulivannhs");
        logAction($logConn, $_SESSION['user_id'], $_SESSION['email'], $_SESSION['role'], $action, $details);
        $logConn->close();
        // -----------------

        echo json_encode(["success" => true, "message" => "Subject added successfully (SHS)"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add subject"]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid assigned level"]);
$conn->close();
?>
