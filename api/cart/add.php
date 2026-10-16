<?php
header('Content-Type: application/json');
error_reporting(0);

require_once __DIR__ . '/../../utils/database.utils.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$userId = !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 1;

// Accept JSON or POST
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) $data = $_POST;

$productId = (int)($data["product_id"] ?? 0);
$size = $data["size"] ?? null;
$pieces = $data["pieces"] ?? null;
$notes = $data["notes"] ?? '';
$qty = max(1, (int)($data["qty"] ?? 1));

if ($productId <= 0) {
    echo json_encode(["success" => false, "error" => "Invalid product"]);
    exit;
}

// GET PRODUCT
$result = $conn->query("SELECT * FROM products WHERE id = $productId");
$product = $result->fetch_assoc();

if (!$product) {
    echo json_encode(["success" => false, "error" => "Product not found"]);
    exit;
}

// GET OR CREATE CART
$result = $conn->query("
    SELECT id FROM carts
    WHERE user_id = $userId AND status = 'active'
    LIMIT 1
");

$cart = $result->fetch_assoc();

if (!$cart) {
    $conn->query("INSERT INTO carts (user_id, status) VALUES ($userId, 'active')");
    $cartId = $conn->insert_id;
} else {
    $cartId = $cart['id'];
}

// PRICE LOGIC
$basePrice = $product['price'];
$unitPrice = $basePrice;

if ($product['category'] === 'drinks') {
    if ($size === 'Grande') $unitPrice += 10;
    if ($size === 'Venti') $unitPrice += 25;
}

if ($product['category'] === 'pastry' || $product['category'] === 'pasta') {
    $pieces = $pieces ? (int)$pieces : 1;
    $unitPrice = $basePrice * $pieces;
}

// INSERT ITEM
$conn->query("
    INSERT INTO cart_items (
        cart_id, product_id, product_name, category,
        image, base_price, unit_price, quantity,
        size, pieces, notes
    ) VALUES (
        $cartId,
        $productId,
        '{$product['name']}',
        '{$product['category']}',
        '{$product['image_path']}',
        $basePrice,
        $unitPrice,
        $qty,
        " . ($size ? "'$size'" : "NULL") . ",
        " . ($pieces ? $pieces : "NULL") . ",
        '$notes'
    )
");

echo json_encode([
    "success" => true
]);