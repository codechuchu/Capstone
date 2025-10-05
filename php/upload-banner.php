<?php
header('Content-Type: application/json');

$targetDir = "uploads/";
$fullDir = __DIR__ . "/" . $targetDir;

if (!file_exists($fullDir)) {
    mkdir($fullDir, 0777, true);
}

$response = [];
$conn = new mysqli("localhost", "root", "", "sulivannhs");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "DB connection failed"]);
    exit;
}

if (!empty($_FILES['bannerPhotos']['name'])) {
    foreach ($_FILES['bannerPhotos']['tmp_name'] as $key => $tmp_name) {
        $fileName = time() . "_" . basename($_FILES['bannerPhotos']['name'][$key]);
        $targetFile = $fullDir . $fileName;
        $dbPath = "php/" . $targetDir . $fileName;

        if (move_uploaded_file($tmp_name, $targetFile)) {
            $stmt = $conn->prepare("INSERT INTO frontpage_banners (image_path) VALUES (?)");
            $stmt->bind_param("s", $dbPath);
            $stmt->execute();
            $id = $stmt->insert_id;
            $stmt->close();

            $response[] = ["success" => true, "id" => $id, "file" => $dbPath];
        } else {
            $response[] = ["success" => false, "file" => $fileName];
        }
    }
} else {
    $response[] = ["success" => false, "error" => "No files received"];
}

$conn->close();
echo json_encode($response);
