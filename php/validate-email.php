<?php
header('Content-Type: application/json');

if (!isset($_GET['email'])) {
    echo json_encode(["success" => false, "error" => "Email not provided"]);
    exit;
}

$email = urlencode($_GET['email']);
$apiUrl = "https://rapid-email-verifier.fly.dev/api/validate?email={$email}";

$response = @file_get_contents($apiUrl);

if ($response === FALSE) {
    echo json_encode(["success" => false, "error" => "Could not verify email right now, try again later"]);
    exit;
}
echo $response;
