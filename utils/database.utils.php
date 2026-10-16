<?php

/**
 * Brew-Ha Café Database Connection Layer
 * Supports:
 * - Native MySQL / MariaDB via MySQLi (local or cloud via DATABASE_URL / MYSQL_URL / DB_* env vars)
 * - Automatic SQLite Fallback with zero-config auto-seeding if MySQL is unavailable
 */

class BrewhaDbResult {
    private array $rows;
    private int $cursor = 0;
    public int $num_rows = 0;

    public function __construct(array $rows) {
        $this->rows = $rows;
        $this->num_rows = count($rows);
    }

    public function fetch_assoc(): ?array {
        if ($this->cursor < $this->num_rows) {
            return $this->rows[$this->cursor++];
        }
        return null;
    }
}

class BrewhaDbStmt {
    private PDO $pdo;
    private string $sql;
    private array $boundParams = [];
    public int $insert_id = 0;
    public string $error = '';
    private ?PDOStatement $executedStmt = null;

    public function __construct(PDO $pdo, string $sql) {
        $this->pdo = $pdo;
        $this->sql = $sql;
    }

    public function bind_param(string $types, &...$args): bool {
        $this->boundParams = [];
        foreach ($args as $val) {
            $this->boundParams[] = $val;
        }
        return true;
    }

    public function execute(): bool {
        try {
            $stmt = $this->pdo->prepare($this->sql);
            $res = $stmt->execute($this->boundParams);
            $this->executedStmt = $stmt;
            $this->insert_id = (int)$this->pdo->lastInsertId();
            return $res;
        } catch (Throwable $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function get_result(): BrewhaDbResult {
        if ($this->executedStmt) {
            $rows = $this->executedStmt->fetchAll(PDO::FETCH_ASSOC);
            return new BrewhaDbResult($rows);
        }
        return new BrewhaDbResult([]);
    }

    public function close(): void {
        $this->executedStmt = null;
    }
}

class BrewhaDbWrapper {
    public ?string $connect_error = null;
    public string $error = '';
    public int $insert_id = 0;
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        $this->pdo->sqliteCreateFunction('rand', function() {
            return mt_rand() / mt_getrandmax();
        });
        $this->pdo->sqliteCreateFunction('concat', function(...$args) {
            return implode('', $args);
        });
    }

    public function set_charset(string $charset): bool {
        return true;
    }

    public function prepare(string $sql): BrewhaDbStmt {
        return new BrewhaDbStmt($this->pdo, $sql);
    }

    public function query(string $sql) {
        $trimmed = trim(strtoupper($sql));
        try {
            if (str_starts_with($trimmed, 'SELECT') || str_starts_with($trimmed, 'PRAGMA') || str_starts_with($trimmed, 'SHOW')) {
                $stmt = $this->pdo->query($sql);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return new BrewhaDbResult($rows);
            } else {
                $affected = $this->pdo->exec($sql);
                $this->insert_id = (int)$this->pdo->lastInsertId();
                return ($affected !== false);
            }
        } catch (Throwable $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function close(): void {}
}

/**
 * Auto-seed menu products and initial user accounts if database is empty
 */
function brewha_seed_defaults($db): void {
    try {
        $res = $db->query("SELECT COUNT(*) AS total FROM users");
        $userCount = 0;
        if ($res && ($row = $res->fetch_assoc())) {
            $userCount = (int)$row['total'];
        }

        if ($userCount === 0) {
            $adminPass = password_hash('Admin@123', PASSWORD_DEFAULT);
            $customerPass = password_hash('Customer@123', PASSWORD_DEFAULT);

            $stmt = $db->prepare("INSERT INTO users (name, password, role) VALUES (?, ?, ?)");
            $adminName = 'admin';
            $adminRole = 'admin';
            $stmt->bind_param("sss", $adminName, $adminPass, $adminRole);
            $stmt->execute();

            $custName = 'customer';
            $custRole = 'customer';
            $stmt->bind_param("sss", $custName, $customerPass, $custRole);
            $stmt->execute();
        }

        $resProd = $db->query("SELECT COUNT(*) AS total FROM products");
        $prodCount = 0;
        if ($resProd && ($row = $resProd->fetch_assoc())) {
            $prodCount = (int)$row['total'];
        }

        if ($prodCount === 0) {
            $products = [
                // Drinks
                ['Caramel Macchiato', 'drinks', 150.00, 'Available', 'Rich espresso with creamy steamed milk, vanilla syrup, and caramel drizzle.', 'macchiato.png', 'macchiato.png'],
                ['Caffè Latte', 'drinks', 140.00, 'Available', 'Dark, rich espresso balanced with steamed milk and a light layer of foam.', 'latte.webp', 'latte.webp'],
                ['Caffè Americano', 'drinks', 110.00, 'Available', 'Espresso shots topped with hot water create a light layer of crema.', 'americano.jpg', 'americano.jpg'],
                ['Caffè Mocha', 'drinks', 160.00, 'Available', 'Rich espresso combined with bittersweet chocolate and steamed milk.', 'mocha.png', 'mocha.png'],
                ['Cappuccino', 'drinks', 145.00, 'Available', 'Dark, rich espresso lies in wait under a smoothed and stretched layer of thick foam.', 'cappucino.png', 'cappucino.png'],
                ['Signature Cold Brew', 'drinks', 135.00, 'Available', 'Slow-steeped in cool water for 20 hours for super-smooth, rich flavor.', 'coldbrew.png', 'coldbrew.png'],
                ['Iced Lemon Tea', 'drinks', 110.00, 'Available', 'Freshly brewed black tea infused with real lemon citrus and sweetener.', 'icelemontea.png', 'icelemontea.png'],
                ['Strawberry Cooler', 'drinks', 125.00, 'Available', 'Refreshing strawberry iced refresher with hints of sweet berry delight.', 'strawberry.png', 'strawberry.png'],
                ['Mango Bliss', 'drinks', 130.00, 'Available', 'Sweet tropical mango blended cold for a refreshing tropical escape.', 'mango.png', 'mango.png'],
                ['Watermelon Quencher', 'drinks', 120.00, 'Available', 'Crisp and hydrating fresh watermelon iced drink.', 'watermelon.png', 'watermelon.png'],
                ['Green Apple Sparkler', 'drinks', 120.00, 'Available', 'Tart green apple soda with sparkling fizz and chilled ice.', 'green.png', 'green.png'],
                ['Pineapple Breeze', 'drinks', 125.00, 'Available', 'Sunny pineapple iced drink that transports you straight to the tropics.', 'pineapple.png', 'pineapple.png'],

                // Pastry
                ['Butter Croissant', 'pastry', 85.00, 'Available', 'Classic flaky French pastry baked with 100% pure butter layers.', 'croissant.png', 'croissant.png'],
                ['Cinnamon Roll', 'pastry', 95.00, 'Available', 'Warm swirled pastry with fragrant cinnamon spice and sweet sugar glaze.', 'cinnamonroll.png', 'cinnamonroll.png'],
                ['Blueberry Scone', 'pastry', 90.00, 'Available', 'Tender crumb scone loaded with sweet, juicy blueberries.', 'scone.png', 'scone.png'],
                ['Chocolate Donut', 'pastry', 65.00, 'Available', 'Fluffy glazed ring donut dipped in decadent chocolate ganache.', 'donut.png', 'donut.png'],
                ['Fudge Brownie', 'pastry', 80.00, 'Available', 'Rich, dense chocolate brownie square with chewy edges and soft center.', 'brownie.png', 'brownie.png'],
                ['Danish Pastry', 'pastry', 95.00, 'Available', 'Crispy layered pastry topped with fruit preserve and delicate glaze.', 'danish.png', 'danish.png'],
                ['French Macaron', 'pastry', 70.00, 'Available', 'Delicate almond meringue sandwich cookie with rich ganache center.', 'macaroon.png', 'macaroon.png'],
                ['Chocolate Éclair', 'pastry', 105.00, 'Available', 'Choux pastry filled with creamy custard and covered with chocolate icing.', 'eclair.png', 'eclair.png'],
                ['Italian Cannoli', 'pastry', 110.00, 'Available', 'Crisp fried pastry tube filled with sweet, velvety ricotta cream.', 'cannoli.png', 'cannoli.png'],
                ['Blueberry Muffin', 'pastry', 85.00, 'Available', 'Moist golden bakery muffin overflowing with fresh blueberries.', 'muffin.png', 'muffin.png'],
                ['Caramelized Palmier', 'pastry', 75.00, 'Available', 'Crisp French heart-shaped puff pastry caramelized with golden sugar.', 'palmeir.png', 'palmeir.png'],
                ['Almond Biscotti', 'pastry', 60.00, 'Available', 'Twice-baked crunchy Italian cookie loaded with whole roasted almonds.', 'biscotti.png', 'biscotti.png'],

                // Pasta
                ['Spaghetti Carbonara', 'pasta', 220.00, 'Available', 'Traditional Italian pasta with rich egg yolks, aged cheese, and savory bacon.', 'carbonara.png', 'carbonara.png'],
                ['Classic Bolognese', 'pasta', 210.00, 'Available', 'Hearty minced beef simmered in rich San Marzano tomato ragù sauce.', 'bolognese.png', 'bolognese.png'],
                ['Penne Arrabbiata', 'pasta', 190.00, 'Available', 'Spicy garlic and tomato sauce with crushed red pepper flakes.', 'arrabbiata.png', 'arrabbiata.png'],
                ['Creamy Fettuccine Alfredo', 'pasta', 200.00, 'Available', 'Rich butter and parmesan cream sauce tossed with tender fettuccine.', 'alfredo.png', 'alfredo.png'],
                ['Genovese Basil Pesto', 'pasta', 215.00, 'Available', 'Fragrant crushed basil, pine nuts, garlic, parmesan, and extra virgin olive oil.', 'pesto.png', 'pesto.png'],
                ['Cacio e Pepe', 'pasta', 195.00, 'Available', 'Minimalist Roman favorite made with grated Pecorino Romano and coarse cracked pepper.', 'cacioepepe.png', 'cacioepepe.png'],
                ['Truffle Mushroom Pasta', 'pasta', 260.00, 'Available', 'Decadent black truffle oil, sautéed wild mushrooms, and parmesan cream.', 'truffle.png', 'truffle.png'],
                ['Seafood Marinara', 'pasta', 250.00, 'Available', 'Juicy prawns, squid, and mussels tossed in a savory herb marinara sauce.', 'seafood.png', 'seafood.png'],
                ['Spaghetti alle Vongole', 'pasta', 240.00, 'Available', 'Fresh clams simmered in white wine, garlic, and fresh Italian parsley.', 'vongole.png', 'vongole.png'],
                ['Garden Pasta Primavera', 'pasta', 185.00, 'Available', 'Medley of fresh sautéed seasonal vegetables in garlic and light olive oil.', 'primavera.png', 'primavera.png'],
                ['Pasta all’Amatriciana', 'pasta', 210.00, 'Available', 'Robust sauce of cured pork, sweet tomatoes, and sharp Pecorino cheese.', 'amatriciana.png', 'amatriciana.png'],
                ['Slow-Braised Beef Ragù', 'pasta', 230.00, 'Available', 'Tender pulled beef braised for hours with red wine, herbs, and aromatics.', 'ragu.png', 'ragu.png']
            ];

            $stmtProd = $db->prepare("
                INSERT INTO products (name, category, price, availability, description, image, image_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($products as $p) {
                $stmtProd->bind_param("ssdssss", $p[0], $p[1], $p[2], $p[3], $p[4], $p[5], $p[6]);
                $stmtProd->execute();
            }
        }
    } catch (Throwable $e) {
        error_log("brewha_seed_defaults notice: " . $e->getMessage());
    }
}

// -------------------------------------------------------------
// Establish Connection
// -------------------------------------------------------------

$databaseUrl = getenv('DATABASE_URL') ?: (getenv('MYSQL_URL') ?: getenv('CLEARDB_DATABASE_URL'));
$host = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: '127.0.0.1');
$port = (int)(getenv('DB_PORT') ?: (getenv('MYSQL_PORT') ?: 3306));
$dbname = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: 'brewha_db');
$username = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: 'root');
$password = getenv('DB_PASSWORD') ?: (getenv('MYSQL_PASSWORD') ?: '');

if ($databaseUrl) {
    $parsed = parse_url($databaseUrl);
    if ($parsed && isset($parsed['host'])) {
        $host = $parsed['host'];
        if (isset($parsed['port'])) $port = (int)$parsed['port'];
        if (isset($parsed['user'])) $username = $parsed['user'];
        if (isset($parsed['pass'])) $password = $parsed['pass'];
        if (isset($parsed['path'])) $dbname = ltrim($parsed['path'], '/');
    }
}

$conn = null;

// Try MySQL if mysqli extension exists and not explicitly set to sqlite
if (extension_loaded('mysqli') && getenv('DB_DRIVER') !== 'sqlite') {
    mysqli_report(MYSQLI_REPORT_OFF);
    $conn = @new mysqli($host, $username, $password, $dbname, $port);

    if (!$conn->connect_error) {
        $conn->set_charset('utf8mb4');
        brewha_seed_defaults($conn);
    } else {
        $conn = null;
    }
}

// Seamless SQLite Fallback (Zero Setup / Instant Cloud Readiness)
if (!$conn) {
    $dbDir = __DIR__ . '/../database';
    if (!is_dir($dbDir)) {
        @mkdir($dbDir, 0777, true);
    }
    $sqliteFile = $dbDir . '/brewha.db';
    if (!file_exists($sqliteFile) && !is_writable($dbDir)) {
        // Fallback to sys temp dir if project root is read-only
        $sqliteFile = sys_get_temp_dir() . '/brewha.db';
    }

    $pdo = new PDO('sqlite:' . $sqliteFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Create tables in SQLite
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL DEFAULT 0.0,
            availability TEXT NOT NULL DEFAULT 'Available',
            description TEXT,
            image TEXT DEFAULT '',
            image_path TEXT DEFAULT '',
            size TEXT DEFAULT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            category TEXT DEFAULT '',
            image TEXT DEFAULT '',
            base_price REAL NOT NULL DEFAULT 0.0,
            unit_price REAL NOT NULL DEFAULT 0.0,
            quantity INTEGER NOT NULL DEFAULT 1,
            size TEXT DEFAULT NULL,
            pieces INTEGER DEFAULT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            cart_id INTEGER DEFAULT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            payment_status TEXT NOT NULL DEFAULT 'Unpaid',
            payment_method TEXT DEFAULT '',
            delivery_method TEXT DEFAULT '',
            address TEXT,
            subtotal REAL NOT NULL DEFAULT 0.0,
            delivery_fee REAL NOT NULL DEFAULT 0.0,
            total REAL NOT NULL DEFAULT 0.0,
            estimated_minutes INTEGER DEFAULT 30,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            category TEXT DEFAULT '',
            image TEXT DEFAULT '',
            unit_price REAL NOT NULL DEFAULT 0.0,
            quantity INTEGER NOT NULL DEFAULT 1,
            size TEXT DEFAULT NULL,
            pieces INTEGER DEFAULT NULL,
            notes TEXT,
            line_total REAL NOT NULL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $conn = new BrewhaDbWrapper($pdo);
    brewha_seed_defaults($conn);
}