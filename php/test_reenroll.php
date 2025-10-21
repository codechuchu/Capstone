<?php
// test_reenroll.php

// Sample data for testing
$data = [
    "students" => [246],           // Replace with actual applicant_id(s)
    "grade_level" => 11,
    "semester" => 1,
    "strand" => "STEM",
    "new_section_name" => "A",
    "school_year" => "2025-2026"
];

// Send POST request to re_enroll_students.php
$options = [
    "http" => [
        "header" => "Content-Type: application/json\r\n",
        "method" => "POST",
        "content" => json_encode($data),
    ],
];

$context = stream_context_create($options);
$url = "http://localhost:8080/capstone/php/re_enroll_students.php"; // <- Replace with actual path
$response = file_get_contents($url, false, $context);

// Show the raw response
echo "<pre>";
var_dump($response);
echo "</pre>";
?>
