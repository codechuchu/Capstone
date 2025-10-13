<?php
session_start();
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Logged-in user's level (Junior High / Senior High)
$userLevel = $_SESSION['assigned_level'] ?? ''; 

// Optional filters
$search = $_GET['search'] ?? '';
$date = $_GET['date'] ?? '';

// Build WHERE conditions for search and date
$whereClauses = [];
$params = [];
$types = "";

if ($search) {
    $whereClauses[] = "(a.username LIKE ? OR a.action LIKE ? OR a.details LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $types .= "sss";
}

if ($date) {
    $whereClauses[] = "DATE(a.timestamp) = ?";
    $params[] = $date;
    $types .= "s";
}

// Main SQL with LEFT JOINs to determine assigned_level for filtering
$sql = "
SELECT a.*
FROM audit_trail a
LEFT JOIN admin ad ON a.user_id = ad.id AND a.role='admin'
LEFT JOIN teachers t ON a.user_id = t.teacher_id AND a.role='teachers'
LEFT JOIN shs_applicant s ON a.user_id = s.applicant_id AND a.role='shs_applicant'
LEFT JOIN jhs_applicants j ON a.user_id = j.applicant_id AND a.role='jhs_applicants'
";

// Level filter based on logged-in user's level
$levelFilter = "(
    (a.role='admin' AND ad.assigned_level=?) OR
    (a.role='teachers' AND t.assigned_level=?) OR
    (a.role='shs_applicant' AND s.grade_level BETWEEN 11 AND 12) OR
    (a.role='jhs_applicants' AND j.grade_level BETWEEN 7 AND 10)
)";
$params = array_merge([$userLevel, $userLevel], $params);
$types = "ss" . $types;

// Combine WHERE clauses
if (!empty($whereClauses)) {
    $sql .= " WHERE $levelFilter AND " . implode(" AND ", $whereClauses);
} else {
    $sql .= " WHERE $levelFilter";
}

$sql .= " ORDER BY a.timestamp DESC";

// Prepare statement
$stmt = $conn->prepare($sql);
if ($types) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$logs = [];
while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
}

// Total count for info (optional)
$countSql = "
SELECT COUNT(*) as total
FROM audit_trail a
LEFT JOIN admin ad ON a.user_id = ad.id AND a.role='admin'
LEFT JOIN teachers t ON a.user_id = t.teacher_id AND a.role='teachers'
LEFT JOIN shs_applicant s ON a.user_id = s.applicant_id AND a.role='shs_applicant'
LEFT JOIN jhs_applicants j ON a.user_id = j.applicant_id AND a.role='jhs_applicants'
WHERE $levelFilter
";
$countStmt = $conn->prepare($countSql);
$countStmt->bind_param("ss", $userLevel, $userLevel);
$countStmt->execute();
$total = $countStmt->get_result()->fetch_assoc()['total'];

echo json_encode([
    "success" => true,
    "data" => $logs,
    "total" => $total
]);

$conn->close();
?>
