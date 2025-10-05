<?php
$conn = new mysqli("localhost", "u705788258_sulivan", "Sulivannhs2025", "u705788258_sulivannhs");

if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
} else {
    echo "✅ Database connected successfully!";
}
?>
