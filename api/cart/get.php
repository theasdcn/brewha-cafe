<?php
header('Content-Type: application/json');
error_reporting(0);

require_once __DIR__ . '/../../utils/database.utils.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$userId = !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 1;

// GET ACTIVE CART
$result = $conn->query("
    SELECT id FROM carts
    WHERE user_id = $userId AND status = 'active'
    LIMIT 1
");

$cart = $result->fetch_assoc();

if (!$cart) {
    echo json_encode([
        "success" => true,
        "cart" => [],
        "count" => 0
    ]);
    exit;
}

$cartId = $cart['id'];

// GET ALL ITEMS
$result = $conn->query("
    SELECT
        id,
        product_id,
        product_name AS name,
        category,
        image AS img,
        base_price,
        unit_price AS price,
        quantity AS qty,
        size,
        pieces,
        notes
    FROM cart_items
    WHERE cart_id = $cartId
    ORDER BY id ASC
");

$items = [];

while ($row = $result->fetch_assoc()) {
    $row["id"] = (int)$row["id"];
    $row["product_id"] = (int)$row["product_id"];
    $row["base_price"] = (float)$row["base_price"];
    $row["price"] = (float)$row["price"];
    $row["qty"] = (int)$row["qty"];
    $row["pieces"] = $row["pieces"] ? (int)$row["pieces"] : null;
    $row["addons"] = $row["notes"] ? [$row["notes"]] : [];

    $items[] = $row;
}

// COUNT
$count = 0;
foreach ($items as $i) {
    $count += $i["qty"];
}

echo json_encode([
    "success" => true,
    "cart" => $items,
    "count" => $count
]);