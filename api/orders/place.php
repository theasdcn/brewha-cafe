<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../../utils/database.utils.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$userId = !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 1;

// Accept BOTH JSON and POST
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) $data = $_POST;

$payment = $data['payment_method'] ?? '';
$delivery = $data['delivery_method'] ?? '';
$fee = (float)($data['delivery_fee'] ?? 0);
$address = $data['address'] ?? '';

if (!$payment || !$delivery) {
    echo json_encode(["success" => false, "error" => "Missing data"]);
    exit;
}

// GET ACTIVE CART
$result = $conn->query("
    SELECT id FROM carts
    WHERE user_id = $userId AND status = 'active'
    LIMIT 1
");

$cart = $result->fetch_assoc();

if (!$cart) {
    echo json_encode(["success" => false, "error" => "Cart not found"]);
    exit;
}

$cartId = $cart['id'];

// GET CART ITEMS
$result = $conn->query("
    SELECT * FROM cart_items
    WHERE cart_id = $cartId
");

$items = [];
$subtotal = 0;

while ($row = $result->fetch_assoc()) {
    $items[] = $row;
    $subtotal += $row['unit_price'] * $row['quantity'];
}

if (count($items) === 0) {
    echo json_encode(["success" => false, "error" => "Cart is empty"]);
    exit;
}

$total = $subtotal + $fee;

// INSERT ORDER
$orderNumber = 'ORD-' . time();

$stmt = $conn->prepare("
    INSERT INTO orders (
        order_number,
        user_id,
        cart_id,
        status,
        payment_status,
        payment_method,
        delivery_method,
        address,
        subtotal,
        delivery_fee,
        total,
        estimated_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$status = 'Pending';
$paymentStatus = 'Unpaid';
$estimated = 30;

$stmt->bind_param(
    "siisssssdddi",
    $orderNumber,
    $userId,
    $cartId,
    $status,
    $paymentStatus,
    $payment,
    $delivery,
    $address,
    $subtotal,
    $fee,
    $total,
    $estimated
);

$stmt->execute();

if ($stmt->error) {
    echo json_encode([
        "success" => false,
        "error" => $stmt->error
    ]);
    exit;
}

$orderId = $stmt->insert_id;

// ✅ CORRECT ORDER ITEMS INSERT
foreach ($items as $item) {
    $stmtItem = $conn->prepare("
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            category,
            image,
            unit_price,
            quantity,
            size,
            pieces,
            notes,
            line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $lineTotal = $item['unit_price'] * $item['quantity'];

    $stmtItem->bind_param(
        "iisssdisssd",
        $orderId,
        $item['product_id'],
        $item['product_name'],
        $item['category'],
        $item['image'],
        $item['unit_price'],
        $item['quantity'],
        $item['size'],
        $item['pieces'],
        $item['notes'],
        $lineTotal
    );

    $stmtItem->execute();
}
// CLEAR CART
$conn->query("DELETE FROM cart_items WHERE cart_id = $cartId");
$conn->query("UPDATE carts SET status = 'completed' WHERE id = $cartId");

echo json_encode([
    "success" => true,
    "order_id" => $orderId
]);