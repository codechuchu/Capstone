<?php
header('Content-Type: application/json');
error_reporting(0);
date_default_timezone_set('Asia/Manila');

try {
    $conn = new mysqli("localhost", "root", "", "sulivannhs");
    if ($conn->connect_error) throw new Exception("Database connection failed");

    $data = json_decode(file_get_contents('php://input'), true);
    $level = strtolower($data['level'] ?? '');
    $dates = $data['dates'] ?? [];

    if (!in_array($level, ['jhs','shs']) || !is_array($dates)) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        exit;
    }

    $table = $level === 'jhs' ? 'jhs_encoding_dates' : 'shs_encoding_dates';

    // Define exact columns for each table
    $columns = $level === 'jhs'
        ? ['q1_start','q1_end','q2_start','q2_end','q3_start','q3_end','q4_start','q4_end']
        : ['q1_start','q1_end','q2_start','q2_end'];

    // Check if a row exists
    $checkRes = $conn->query("SELECT id FROM $table LIMIT 1");

    if ($checkRes->num_rows > 0) {
        // UPDATE existing row
        $set = implode(", ", array_map(fn($col) => "$col = ?", $columns));
        $stmt = $conn->prepare("UPDATE $table SET $set LIMIT 1");
    } else {
        // INSERT new row
        $placeholders = implode(",", array_fill(0, count($columns), "?"));
        $cols = implode(",", $columns);
        $stmt = $conn->prepare("INSERT INTO $table ($cols) VALUES ($placeholders)");
    }

    // Map keys from JS (Q1_start → q1_start)
    $values = [];
    foreach ($columns as $col) {
        $key = strtolower($col); // ensure lowercase
        $values[] = $dates[$key] ?? null;
    }

    $types = str_repeat('s', count($columns)); // all strings (dates)
    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Encoding dates saved successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed: '.$stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
