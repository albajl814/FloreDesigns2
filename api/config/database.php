<?php
// ============================================================
//  FloreDesigns - Configuración y conexión a la base de datos
//  Lee credenciales desde .env — nunca hardcodeadas.
//  Aplica headers de seguridad HTTP en cada respuesta.
// ============================================================

function cargarEnv(): void {
    $ruta = dirname(__DIR__, 2) . '/.env';
    if (!file_exists($ruta)) return;
    $lineas = file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lineas as $linea) {
        $linea = trim($linea);
        if ($linea === '' || str_starts_with($linea, '#')) continue;
        if (!str_contains($linea, '=')) continue;
        [$clave, $valor] = explode('=', $linea, 2);
        $clave = trim($clave); $valor = trim($valor);
        if (!isset($_ENV[$clave])) { $_ENV[$clave] = $valor; putenv("$clave=$valor"); }
    }
}
cargarEnv();

define('DB_HOST',    $_ENV['DB_HOST']    ?? 'localhost:3307');
define('DB_NAME',    $_ENV['DB_NAME']    ?? 'floredesigns');
define('DB_USER',    $_ENV['DB_USER']    ?? 'root');
define('DB_PASS',    $_ENV['DB_PASS']    ?? '');
define('DB_CHARSET', $_ENV['DB_CHARSET'] ?? 'utf8mb4');

define('JWT_SECRET',           $_ENV['JWT_SECRET']           ?? 'cambiar_en_produccion');
define('JWT_EXPIRA_MINUTOS',   (int)($_ENV['JWT_EXPIRA_MINUTOS']   ?? 15));
define('JWT_REFRESH_DIAS',     (int)($_ENV['JWT_REFRESH_DIAS']     ?? 7));
define('MAX_INTENTOS_LOGIN',   (int)($_ENV['MAX_INTENTOS_LOGIN']   ?? 5));
define('BLOQUEO_MINUTOS',      (int)($_ENV['BLOQUEO_MINUTOS']      ?? 15));
define('MFA_EXPIRA_MINUTOS',   (int)($_ENV['MFA_EXPIRA_MINUTOS']   ?? 10));
define('RESET_EXPIRA_MINUTOS', (int)($_ENV['RESET_EXPIRA_MINUTOS'] ?? 30));
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');
define('APP_URL', $_ENV['APP_URL'] ?? 'http://localhost');

// ── Headers de seguridad (Práctica 2 — Parte 8) ────────────
function aplicarHeadersSeguridad(): void {
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");
    header('Referrer-Policy: strict-origin-when-cross-origin');
    if (APP_ENV === 'production') header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    $origin = APP_ENV === 'production' ? APP_URL : 'http://localhost';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
aplicarHeadersSeguridad();

class Database {
    private static ?PDO $conexion = null;
    public static function conectar(): PDO {
        if (self::$conexion !== null) return self::$conexion;
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            self::$conexion = new PDO($dsn, DB_USER, DB_PASS, $opciones);
        } catch (PDOException $e) {
            http_response_code(500);
            $msg = APP_ENV === 'development' ? 'Error BD: ' . $e->getMessage() : 'Error de conexión.';
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => $msg]);
            exit;
        }
        return self::$conexion;
    }
}

function responder(array $datos, int $codigo = 200): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function obtenerBodyJSON(): array {
    $body = file_get_contents('php://input');
    if (empty($body)) return [];
    return json_decode($body, true) ?? [];
}