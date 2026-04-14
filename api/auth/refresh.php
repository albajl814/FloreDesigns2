<?php
// ============================================================
//  FloreDesigns - Renovar token JWT
//  Archivo: api/auth/refresh.php
//
//  Que hace:
//  1. Recibe el refresh_token del cliente
//  2. Verifica que exista en BD, no este revocado ni expirado
//  3. Genera un nuevo JWT y lo devuelve
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    responder(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['error' => 'Metodo no permitido'], 405);
}

$body         = obtenerBodyJSON();
$refreshToken = trim($body['refresh_token'] ?? '');

if (empty($refreshToken)) {
    responder(['error' => 'Refresh token requerido'], 400);
}

$db        = Database::conectar();
$tokenHash = hash('sha256', $refreshToken);

// Buscar el refresh token en la BD junto con los datos del usuario
$stmt = $db->prepare("
    SELECT rt.*, u.nombre, u.email, u.activo, r.nombre AS rol_nombre, u.tema
    FROM refresh_tokens rt
    JOIN usuarios u  ON u.id  = rt.usuario_id
    JOIN roles    r  ON r.id  = u.rol_id
    WHERE rt.token_hash = ?
      AND rt.revocado   = 0
      AND rt.usado      = 0
      AND rt.expira_en  > NOW()
    LIMIT 1
");
$stmt->execute([$tokenHash]);
$rt = $stmt->fetch();

if (!$rt) {
    responder(['error' => 'Refresh token invalido o expirado'], 401);
}

if (!$rt['activo']) {
    responder(['error' => 'Cuenta desactivada'], 403);
}

// Marcar el refresh token como usado (rotacion de tokens)
$db->prepare("UPDATE refresh_tokens SET usado = 1 WHERE id = ?")
   ->execute([$rt['id']]);

// Generar nuevo JWT
$payload = [
    'sub'       => $rt['usuario_id'],
    'nombre'    => $rt['nombre'],
    'email'     => $rt['email'],
    'rol'       => $rt['rol_nombre'],
    'sesion_id' => $rt['sesion_id'],
    'iat'       => time(),
    'exp'       => time() + (JWT_EXPIRA_MINUTOS * 60)
];
$nuevoJWT = JWT::generar($payload, JWT_SECRET);

// Generar nuevo refresh token (rotacion)
$nuevoRefresh     = bin2hex(random_bytes(32));
$nuevoRefreshHash = hash('sha256', $nuevoRefresh);
$refreshExpira    = date('Y-m-d H:i:s', strtotime('+' . JWT_REFRESH_DIAS . ' days'));

$stmt = $db->prepare("
    INSERT INTO refresh_tokens (usuario_id, sesion_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
");
$stmt->execute([$rt['usuario_id'], $rt['sesion_id'], $nuevoRefreshHash, $refreshExpira]);

// Actualizar ultima actividad de la sesion
$db->prepare("UPDATE sesiones SET ultima_actividad = NOW() WHERE id = ?")
   ->execute([$rt['sesion_id']]);

responder([
    'token'         => $nuevoJWT,
    'refresh_token' => $nuevoRefresh
]);
