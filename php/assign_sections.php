<?php
session_start();
header('Content-Type: application/json');

set_exception_handler(function ($e) {
    echo json_encode(["error" => $e->getMessage()]);
    exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

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
$pdo = new PDO($dsn, $user, $pass, $options);

if (!isset($_SESSION['assigned_level'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$grade  = trim($data['grade'] ?? '');
$strand = trim($data['strand'] ?? '');
$customSectionName = trim($data['section_name'] ?? '');
$force = $data['force'] ?? false;

$assigned_level = strtolower($_SESSION['assigned_level']);

if ($grade === '') {
    echo json_encode(["error" => "Grade is required"]);
    exit;
}

if ($assigned_level === 'senior high' && $strand === '') {
    echo json_encode(["error" => "Strand is required for SHS"]);
    exit;
}

if ($customSectionName === '') {
    echo json_encode(["error" => "Section name is required"]);
    exit;
}

// ---------- DETERMINE SCHOOL YEAR ----------
$today = date('Y-m-d');
$periodStmt = $pdo->query("
    SELECT * 
    FROM activation_periods 
    WHERE '$today' BETWEEN start_date AND end_date
    LIMIT 1
");
$period = $periodStmt->fetch();

if ($period) {
    $startYear = date('Y', strtotime($period['start_date']));
    $endYear   = date('Y', strtotime($period['end_date']));

    if ($startYear == $endYear) {
        $schoolYear = $startYear . '-' . ($startYear + 1);
    } else {
        $schoolYear = $startYear . '-' . $endYear;
    }
} else {
    // fallback if no active period
    $year = date('Y');
    $month = date('n');
    if ($month >= 6) { 
        $schoolYear = $year . '-' . ($year + 1);
    } else {
        $schoolYear = ($year - 1) . '-' . $year;
    }
}

// Fetch unassigned students
if ($assigned_level === 'senior high') {
    $stmt = $pdo->prepare("
        SELECT applicant_id, CONCAT(firstname, ' ', lastname, 
               CASE WHEN suffix IS NOT NULL AND suffix <> '' THEN CONCAT(' ', suffix) ELSE '' END) AS student_name
        FROM shs_applicant
        WHERE LOWER(strand) = LOWER(?)
          AND grade_level = ?
          AND LOWER(status) = 'enrolled'
          AND section_id IS NULL
        ORDER BY lastname, firstname
    ");
    $stmt->execute([$strand, $grade]);
    $baseName = strtoupper($strand) . " " . $grade;
    $strandStmt = $pdo->prepare("SELECT strand_id FROM strand WHERE LOWER(strand) = LOWER(?)");
    $strandStmt->execute([$strand]);
    $strandRow = $strandStmt->fetch();
    $strandId = $strandRow ? $strandRow['strand_id'] : null;

} elseif ($assigned_level === 'junior high') {
    $stmt = $pdo->prepare("
        SELECT applicant_id, CONCAT(firstname, ' ', lastname, 
               CASE WHEN suffix IS NOT NULL AND suffix <> '' THEN CONCAT(' ', suffix) ELSE '' END) AS student_name
        FROM jhs_applicants
        WHERE grade_level = ?
          AND LOWER(status) = 'enrolled'
          AND section_id IS NULL
        ORDER BY lastname, firstname
    ");
    $stmt->execute([$grade]);
    $baseName = "Grade " . $grade;

    // For JHS, provide dummy strand values to satisfy foreign key
    $strand = 'JHS';
    $strandId = 1; // Ensure you have a "JHS" row in your strand table with ID = 1
} else {
    echo json_encode(["error" => "Invalid assigned level"]);
    exit;
}

$students = $stmt->fetchAll();
if (!$students) {
    echo json_encode(["error" => "No unassigned students found"]);
    exit;
}

$studentsPerSection = 40;
$totalStudents = count($students);

if ($totalStudents < $studentsPerSection && !$force) {
    echo json_encode([
        "error" => "not_enough",
        "available" => $totalStudents,
        "required" => $studentsPerSection
    ]);
    exit;
}

$currentIndex = 0;
$sectionName = $baseName . "-" . strtoupper($customSectionName);

// Create new section with school_year
$pdo->prepare("
    INSERT INTO sections_list (section_name, strand, strand_id, grade_level, semester, total_students, assigned_level, school_year)
    VALUES (?, ?, ?, ?, 1, 0, ?, ?)
")->execute([
    $sectionName,
    $strand,
    $strandId,
    $grade,
    ucfirst($assigned_level),
    $schoolYear
]);

$sectionId = $pdo->lastInsertId();
$sectionStudentCount = 0;

// Assign students
while ($currentIndex < $totalStudents && $sectionStudentCount < $studentsPerSection) {
    $student = $students[$currentIndex];

    $pdo->prepare("
        INSERT INTO section (section_id, student_name, strand, grade_level, student_id)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([$sectionId, $student['student_name'], $strand, $grade, $student['applicant_id']]);

    if ($assigned_level === 'senior high') {
        $pdo->prepare("UPDATE shs_applicant SET section_id = ? WHERE applicant_id = ?")
            ->execute([$sectionId, $student['applicant_id']]);
    } else {
        $pdo->prepare("UPDATE jhs_applicants SET section_id = ? WHERE applicant_id = ?")
            ->execute([$sectionId, $student['applicant_id']]);
    }

    $sectionStudentCount++;
    $currentIndex++;
}

// Update total_students
$pdo->prepare("UPDATE sections_list SET total_students = ? WHERE section_id = ?")
    ->execute([$sectionStudentCount, $sectionId]);

// ======================
// ✅ AUDIT LOG
// ======================
$logSql = "
    INSERT INTO audit_trail (user_id, username, role, action, details, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
";

$userId   = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? 'unknown';
$role     = $_SESSION['role'] ?? 'unknown';
$action   = "Section Created";
$details  = "Created section '$sectionName' with $sectionStudentCount student(s), grade $grade, strand $strand, S.Y. $schoolYear";

$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$stmt = $pdo->prepare($logSql);
$stmt->execute([$userId, $username, $role, $action, $details, $ipAddress]);

echo json_encode(["success" => true, "message" => "Section created with custom name."]);
?>
