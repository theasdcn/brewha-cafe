<?php

/**
 * Brew-Ha Café Single Entry Point Router for Vercel Serverless
 * Bundles all API routes into a single serverless function to stay well within
 * Vercel Hobby's 12-function limit.
 */

$rawUri = $_SERVER['HTTP_X_MATCHED_PATH'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$uri = parse_url($rawUri, PHP_URL_PATH) ?: '/';

// Strip /ECOM-FINALS1/ prefix if present
$cleanUri = preg_replace('#^/ECOM-FINALS1/#', '/', $uri);

// Route setup_db.php
if ($cleanUri === '/setup_db.php' || str_ends_with($cleanUri, '/setup_db.php')) {
    require __DIR__ . '/setup_db.php';
    exit;
}

// Strip /api/index.php or /api/
$subPath = preg_replace('#^/?api/(index\.php/?)?#', '', $cleanUri);
$subPath = ltrim($subPath, '/');

// Check query parameter fallback
if ($subPath === '' && !empty($_GET['route'])) {
    $subPath = ltrim($_GET['route'], '/');
}

if ($subPath === '' || $subPath === 'index.php') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'online',
        'service' => 'Brew-Ha Cafe API Gateway',
        'version' => '1.0'
    ]);
    exit;
}

$targetFile = __DIR__ . '/' . $subPath;

// Try exact file
if (is_file($targetFile) && realpath($targetFile) !== __FILE__) {
    require $targetFile;
    exit;
}

// Try with .php extension if omitted
if (is_file($targetFile . '.php')) {
    require $targetFile . '.php';
    exit;
}

// Not found
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => false,
    'error' => 'API endpoint not found: ' . htmlspecialchars($cleanUri)
]);
exit;
