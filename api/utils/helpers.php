<?php
// ============================================================
//  FloreDesigns - Funciones auxiliares
//  Archivo: api/utils/helpers.php
// ============================================================

/**
 * Obtiene la IP real del cliente.
 * Considera proxies y balanceadores de carga.
 */
function obtenerIP(): string {
    $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = trim(explode(',', $_SERVER[$header])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}

/**
 * Genera un UUID v4 (identificador unico para sesiones).
 * Ejemplo: "a3f5c2d1-4b8e-4f2a-9c1d-3e7b5a8f2d4c"
 */
function generarUUID(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

/**
 * Genera un codigo MFA de 6 digitos.
 * Ejemplo: "482916"
 */
function generarCodigoMFA(): string {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Detecta el tipo de dispositivo desde el User-Agent.
 * Devuelve algo legible como "Windows / Chrome" o "iPhone / Safari".
 */
function detectarDispositivo(string $userAgent): string {
    $os      = 'Desconocido';
    $browser = 'Desconocido';

    // Detectar sistema operativo
    if (str_contains($userAgent, 'Windows'))     $os = 'Windows';
    elseif (str_contains($userAgent, 'Macintosh')) $os = 'Mac';
    elseif (str_contains($userAgent, 'iPhone'))    $os = 'iPhone';
    elseif (str_contains($userAgent, 'Android'))   $os = 'Android';
    elseif (str_contains($userAgent, 'Linux'))     $os = 'Linux';

    // Detectar navegador
    if (str_contains($userAgent, 'Chrome') && !str_contains($userAgent, 'Edg'))
        $browser = 'Chrome';
    elseif (str_contains($userAgent, 'Firefox'))   $browser = 'Firefox';
    elseif (str_contains($userAgent, 'Safari') && !str_contains($userAgent, 'Chrome'))
        $browser = 'Safari';
    elseif (str_contains($userAgent, 'Edg'))       $browser = 'Edge';

    return "$os / $browser";
}

/**
 * Registra un intento de login en la base de datos.
 * Se llama tanto en intentos exitosos como fallidos.
 */
function registrarIntento(PDO $db, string $email, string $ip, bool $exitoso, ?string $razon): void {
    $stmt = $db->prepare("
        INSERT INTO intentos_login (email, ip, exitoso, razon_fallo)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$email, $ip, $exitoso ? 1 : 0, $razon]);
}

/**
 * Middleware: verifica que la peticion venga con un JWT valido.
 * Se usa al inicio de los endpoints protegidos.
 *
 * Uso:
 *   $usuario = requireAuth();
 *   // A partir de aqui, $usuario tiene id, email, rol, etc.
 *
 * Si el token es invalido o falta, responde 401 y termina.
 */
function requireAuth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    // El header llega como: "Bearer eyJhbGci..."
    if (!str_starts_with($authHeader, 'Bearer ')) {
        responder(['error' => 'Token requerido'], 401);
    }

    $token = substr($authHeader, 7); // Quita "Bearer "

    try {
        $payload = JWT::verificar($token, JWT_SECRET);
        return $payload;
    } catch (Exception $e) {
        responder(['error' => 'Token invalido: ' . $e->getMessage()], 401);
    }
}

/**
 * Middleware: verifica que el usuario tenga un rol especifico.
 *
 * Uso:
 *   $usuario = requireAuth();
 *   requireRol($usuario, 'admin');
 */
function requireRol(array $usuario, string ...$rolesPermitidos): void {
    if (!in_array($usuario['rol'], $rolesPermitidos)) {
        responder(['error' => 'Acceso denegado: se requiere rol ' . implode(' o ', $rolesPermitidos)], 403);
    }
}
