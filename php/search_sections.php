<?php
session_start();
header('Content-Type: application/json');
$pdo = new PDO("mysql:host=localhost;dbname=sulivannhs;charset=utf8mb4", "root", "", [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$query = trim($_GET['query'] ?? '');
if (!$query) { echo json_encode([]); exit; }

$stmt = $pdo->prepare("SELECT section_id, section_name FROM sections_list WHERE section_name LIKE ?");
$stmt->execute(["%$query%"]);
echo json_encode($stmt->fetchAll());
