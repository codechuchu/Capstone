<?php
session_start(); // MUST be first
header("Content-Type: application/json");


if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Not logged in"
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "role" => $_SESSION['role'] ?? null,
    "user_id" => $_SESSION['user_id'] ?? null,
    "email" => $_SESSION['email'] ?? null,
    "session_dump" => $_SESSION
]);

exit;
