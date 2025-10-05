<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$db   = 'sulivannhs';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// This will handle AJAX requests
if (isset($_GET['ajax']) && $_GET['ajax'] == '1') {
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sql = "SELECT a.applicant_id, a.firstname, a.lastname, 
                   d.birth_certificate, d.original_form_138, d.good_moral, d.original_form_137
            FROM shs_applicant a
            JOIN applicant_documents d ON a.applicant_id = d.applicant_id";
    if ($search !== '') {
        $sql .= " WHERE a.firstname LIKE :search 
                  OR a.lastname LIKE :search 
                  OR a.applicant_id LIKE :search";
    }
    $sql .= " ORDER BY a.applicant_id DESC";
    $stmt = $pdo->prepare($sql);
    if ($search !== '') {
        $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();

    // Return HTML for table rows only
    foreach ($rows as $row) {
        echo "<tr>
                <td>" . htmlspecialchars($row['applicant_id']) . "</td>
                <td>" . htmlspecialchars($row['firstname'] . ' ' . $row['lastname']) . "</td>
                <td>" . ($row['birth_certificate'] ? "<a href='../php/{$row['birth_certificate']}' target='_blank'>View</a>" : "N/A") . "</td>
                <td>" . ($row['original_form_138'] ? "<a href='../php/{$row['original_form_138']}' target='_blank'>View</a>" : "N/A") . "</td>
                <td>" . ($row['good_moral'] ? "<a href='../php/{$row['good_moral']}' target='_blank'>View</a>" : "N/A") . "</td>
                <td>" . ($row['original_form_137'] ? "<a href='../php/{$row['original_form_137']}' target='_blank'>View</a>" : "N/A") . "</td>
              </tr>";
    }
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Uploaded Documents</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
        th { background-color: #f2f2f2; }
        a { color: blue; text-decoration: underline; }
        .search-box { margin-bottom: 15px; }
        .search-box input[type="text"] {
            padding: 8px;
            width: 250px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
    </style>
</head>
<body>

<h2>Uploaded Documents</h2>

<!-- Live search box -->
<div class="search-box">
    <input type="text" id="searchInput" placeholder="Search by name or ID">
</div>

<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Applicant Name</th>
            <th>Birth Certificate</th>
            <th>Form 138</th>
            <th>Good Moral</th>
            <th>Form 137</th>
        </tr>
    </thead>
    <tbody id="resultsTable">
        <!-- Results will be loaded here -->
    </tbody>
</table>

<script>
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById('searchInput');
    const resultsTable = document.getElementById('resultsTable');

    function fetchResults(query = '') {
        fetch(`get_documents.php?ajax=1&search=${encodeURIComponent(query)}`)
            .then(response => response.text())
            .then(data => {
                resultsTable.innerHTML = data || "<tr><td colspan='6'>No records found</td></tr>";
            })
            .catch(err => console.error(err));
    }

    // Initial load
    fetchResults();

    // Live search on input
    searchInput.addEventListener('keyup', function() {
        fetchResults(this.value);
    });
});
</script>

</body>
</html>
