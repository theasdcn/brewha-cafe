<?php

require_once __DIR__ . '/../../utils/database.utils.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/response.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$userId = !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 1;
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$itemId = (int)($input["item_id"] ?? 0);

if ($itemId <= 0) {
    jsonResponse(["success" => false, "error" => "Invalid cart item ID"], 400);
}

try {
    global $conn;
    $stmt = $conn->prepare("
        DELETE FROM cart_items
        WHERE id = ? AND cart_id IN (SELECT id FROM carts WHERE user_id = ? AND status = 'active')
    ");
    $stmt->bind_param("ii", $itemId, $userId);
    $stmt->execute();

    jsonResponse([
        "success" => true,
        "message" => "Item removed"
    ]);
} catch (Throwable $e) {
    jsonResponse([
        "success" => false,
        "error" => $e->getMessage()
    ], 500);
}