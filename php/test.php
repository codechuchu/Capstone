<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Starting test...<br>";

// Try connecting to the database
try {
    $pdo = new PDO("mysql:host=localhost;dbname=sulivannhs", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connected!<br>";

    // Check if table exists and list columns
    $stmt = $pdo->query("DESCRIBE shs_studentgrade");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($columns);
    echo "</pre>";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
}
