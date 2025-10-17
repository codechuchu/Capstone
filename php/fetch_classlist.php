<?php
session_start();
header('Content-Type: application/json');

$section_id = $_GET['section_id'] ?? null;
if (!$section_id) {
    echo json_encode(['success' => false, 'message' => 'Section ID missing']);
    exit;
}

$host = 'localhost';
$db = 'sulivannhs';
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

    // Fetch section info
    $stmt = $pdo->prepare("SELECT * FROM sections_list WHERE section_id = ?");
    $stmt->execute([$section_id]);
    $section = $stmt->fetch();

    if (!$section) {
        echo json_encode(['success' => false, 'message' => 'Section not found']);
        exit;
    }

    // Determine applicant table
    $assigned_level = $section['assigned_level'];
    $applicant_table = $assigned_level === "Senior High" ? "shs_applicant" : "jhs_applicants";

    // Fetch students
    $stmt = $pdo->prepare("
    SELECT s.student_id, 
           CONCAT(a.firstname, ' ', a.middlename, ' ', a.lastname) AS student_name, 
           a.gender, 
           a.birth_date
    FROM section s
    JOIN $applicant_table a ON s.student_id = a.applicant_id
    WHERE s.section_id = ?
    ORDER BY a.firstname ASC, a.middlename ASC, a.lastname ASC
");
$stmt->execute([$section_id]);
$students = $stmt->fetchAll();


    // Fetch adviser(s) names
    $adviser_ids = array_filter(array_map('trim', explode(',', $section['adviser']))); // multiple advisers
    $adviser_names = [];
    if ($adviser_ids) {
        $placeholders = implode(',', array_fill(0, count($adviser_ids), '?'));
        $stmt = $pdo->prepare("SELECT firstname, middlename, lastname FROM teachers WHERE teacher_id IN ($placeholders)");
        $stmt->execute($adviser_ids);
        $advisers = $stmt->fetchAll();
        $adviser_names = array_map(fn($t) => trim("{$t['firstname']} {$t['middlename']} {$t['lastname']}"), $advisers);
    }

    // Prepared by admin
    $admin_id = $_SESSION['user_id'] ?? null;
    $preparedBy = "N/A";
    if ($admin_id) {
        $stmt = $pdo->prepare("SELECT firstname, middlename, lastname FROM admin WHERE id = ?");
        $stmt->execute([$admin_id]);
        $admin = $stmt->fetch();
        if ($admin) {
            $preparedBy = trim("{$admin['firstname']} {$admin['middlename']} {$admin['lastname']}");
        }
    }

    echo json_encode([
        'success' => true,
        'schoolYear' => date('Y') . '-' . (date('Y') + 1),
        'gradeLevel' => $section['grade_level'],
        'section' => $section['section_name'],
        'adviser' => implode(', ', $adviser_names),
        'strand' => $section['strand'] ?? '',
        'students' => $students,
        'preparedBy' => $preparedBy,
        'date' => date('F j, Y')
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
