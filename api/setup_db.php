<?php

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/../utils/database.utils.php';

global $conn;

$isCli = (php_sapi_name() === 'cli');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brew-Ha Café — Database Initialization</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #12100e;
            color: #f5f0eb;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            max-width: 680px;
            width: 100%;
            background: #1c1815;
            border: 1px solid #332822;
            border-radius: 14px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        h1 {
            color: #d4a373;
            margin-top: 0;
            font-size: 24px;
        }
        .status-badge {
            display: inline-block;
            background: #2b4c3f;
            color: #8ce3b9;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .card {
            background: #25201b;
            border: 1px solid #3d3129;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
        .card h3 {
            margin: 0 0 10px 0;
            color: #faedcd;
            font-size: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            padding: 8px 0;
            border-bottom: 1px solid #332822;
            font-size: 14px;
        }
        td:last-child {
            text-align: right;
            font-weight: 600;
            color: #d4a373;
        }
        .btn-group {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        a.btn {
            display: inline-block;
            padding: 12px 20px;
            background: #d4a373;
            color: #12100e;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            flex: 1;
        }
        a.btn.secondary {
            background: transparent;
            color: #d4a373;
            border: 1px solid #d4a373;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>☕ Brew-Ha Café — Database Status</h1>
    <div class="status-badge">✅ Online & Fully Initialized</div>

    <?php
    $tables = ['users', 'products', 'carts', 'cart_items', 'orders', 'order_items'];
    $counts = [];

    foreach ($tables as $t) {
        $res = $conn->query("SELECT COUNT(*) AS total FROM $t");
        $counts[$t] = ($res && ($row = $res->fetch_assoc())) ? (int)$row['total'] : 0;
    }
    ?>

    <div class="card">
        <h3>Database Tables</h3>
        <table>
            <?php foreach ($counts as $tbl => $cnt): ?>
                <tr>
                    <td><code><?= htmlspecialchars($tbl) ?></code></td>
                    <td><?= $cnt ?> record(s)</td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>

    <div class="card">
        <h3>Pre-configured Credentials</h3>
        <table>
            <tr>
                <td>Admin Account:</td>
                <td>Username: <code>admin</code> | Password: <code>Admin@123</code></td>
            </tr>
            <tr>
                <td>Customer Account:</td>
                <td>Username: <code>customer</code> | Password: <code>Customer@123</code></td>
            </tr>
        </table>
    </div>

    <div class="btn-group">
        <a href="../index.html" class="btn">Go to Storefront</a>
        <a href="../pages/Admin%20Dashboard/index.html" class="btn secondary">Admin Portal</a>
    </div>
</div>
</body>
</html>
