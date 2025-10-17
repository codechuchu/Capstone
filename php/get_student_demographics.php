<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json; charset=utf-8');


$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sulivannhs";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$level = strtolower(trim($_GET['level'] ?? ''));

// --- Determine table and fields ---
if ($level === 'senior high') {
    $table = "shs_applicant";
    $fields = "
        applicant_id,
        firstname,
        middlename,
        lastname,
        suffix,
        gender,
        strand,
        grade_level,
        status,
        lrn,
        cellphone,
        street_house,
        barangay,
        municipal_city,
        province
    ";
    $gradeCondition = "grade_level IN (11, 12)";
} elseif ($level === 'junior high') {
    $table = "jhs_applicants";
    $fields = "
        applicant_id,
        firstname,
        middlename,
        lastname,
        suffix,
        gender,
        grade_level,
        status,
        lrn,
        cellphone,
        street_house,
        barangay,
        municipal_city,
        province
    ";
    $gradeCondition = "`grade_level` BETWEEN 7 AND 10";
} else {
    echo json_encode(['error' => 'Invalid assigned level']);
    exit;
}

// --- Fetch students safely ---
$students = [];
$maleStudents = [];
$femaleStudents = [];
$declinedStudents = [];
$droppedStudents = [];
$studentsPerStrand = [];
$studentsPerYearLevel = [];
$studentsPerGrade = [];

$studentsQuery = "SELECT $fields FROM $table WHERE $gradeCondition";
$studentsRes = $conn->query($studentsQuery);

if ($studentsRes) {
    while ($row = $studentsRes->fetch_assoc()) {
        $student = [
            'applicant_id' => $row['applicant_id'] ?? '',
            'firstname' => $row['firstname'] ?? '',
            'middlename' => $row['middlename'] ?? '',
            'lastname' => $row['lastname'] ?? '',
            'suffix' => $row['suffix'] ?? '',
            'gender' => $row['gender'] ?? '',
            'status' => $row['status'] ?? '',
            'grade_level' => $row['grade_level'] ?? '',
            'lrn' => $row['lrn'] ?? '',
            'cellphone' => $row['cellphone'] ?? '',
            'street_house' => $row['street_house'] ?? '',
            'barangay' => $row['barangay'] ?? '',
            'municipal_city' => $row['municipal_city'] ?? '',
            'province' => $row['province'] ?? ''
        ];

        // --- Grouping ---
        if ($level === 'senior high' && !empty($row['strand'])) {
            $student['strand'] = $row['strand'];
            $studentsPerStrand[$row['strand']][] = $student;
            $studentsPerYearLevel[$row['grade_level']][] = $student;
        } elseif ($level === 'junior high') {
            $studentsPerGrade[$row['grade_level']][] = $student;
        }

        $students[] = $student;

        // --- Gender lists ---
        if (strcasecmp($row['gender'] ?? '', 'Male') === 0) $maleStudents[] = $student;
        if (strcasecmp($row['gender'] ?? '', 'Female') === 0) $femaleStudents[] = $student;

        // --- Status lists ---
        if (strcasecmp($row['status'] ?? '', 'Declined') === 0) $declinedStudents[] = $student;
        if (strcasecmp($row['status'] ?? '', 'Dropped') === 0) $droppedStudents[] = $student;
    }
} else {
    // Return empty arrays if query fails
    $students = [];
}

$output = [
    'students' => $students,
    'male_students' => $maleStudents,
    'female_students' => $femaleStudents,
    'declined_students' => $declinedStudents,
    'dropped_students' => $droppedStudents,
    'total_students' => count($students),
    'total_male' => count($maleStudents),
    'total_female' => count($femaleStudents)
];

if ($level === 'senior high') {
    $output['students_per_strand'] = $studentsPerStrand;
    $output['students_per_year_level'] = $studentsPerYearLevel;
} else {
    $output['students_per_grade'] = $studentsPerGrade;
}

// --- Always return JSON ---
echo json_encode($output);
$conn->close();
