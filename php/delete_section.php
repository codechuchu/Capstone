<?php
header('Content-Type: application/json');

// Database connection
$conn = new mysqli("localhost", "root", "", "sulivannhs");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Get the JSON body
$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['section_name'])) {
    echo json_encode(['success' => false, 'error' => 'Section name not provided.']);
    exit;
}

$section_name = $data['section_name'];

try {
    // 1. Get section_id from sections_list
    $stmt = $conn->prepare("SELECT section_id FROM sections_list WHERE section_name = ?");
    $stmt->bind_param("s", $section_name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'error' => 'Section not found.']);
        exit;
    }

    $row = $result->fetch_assoc();
    $section_id = $row['section_id'];

    // 2. Delete students in section
    $stmt = $conn->prepare("DELETE FROM section WHERE section_id = ?");
    $stmt->bind_param("i", $section_id);
    $stmt->execute();

    // 3. Delete section from sections_list
    $stmt = $conn->prepare("DELETE FROM sections_list WHERE section_id = ?");
    $stmt->bind_param("i", $section_id);
    $stmt->execute();

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
