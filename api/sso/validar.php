<?php
// ============================================================
//  FloreDesigns - SSO: Validar token en App B
//  Archivo: api/sso/validar.php
//
//  App B llama a este endpoint para verificar el token SSO
//  y obtener los datos del usuario sin que haya hecho login.
//
//  POST { "sso_token": "..." }
//  Devuelve: datos del usuario + JWT propio de App B
// ============================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { responder(['error' => 'Método no permitido'], 405); }

$body     = obtenerBodyJSON();
$ssoToken = trim($body['sso_token'] ?? '');

if (empty($ssoToken)) responder(['error' => 'Token SSO requerido'], 400);

$db           = Database::conectar();
$ssoTokenHash = hash('sha256', $ssoToken);

// Buscar el token: debe ser válido, no usado y no expirado
$stmt = $db->prepare("
    SELECT t.id, t.usuario_id, t.app_origen,
           u.nombre, u.email, r.nombre AS rol, u.tema
    FROM tokens_sso t
    JOIN usuarios u ON u.id = t.usuario_id
    JOIN roles    r ON r.id = u.rol_id
    WHERE t.token_hash = ?
      AND t.usado      = 0
      AND t.expira_en  > NOW()
      AND u.activo     = 1
    LIMIT 1
");
$stmt->execute([$ssoTokenHash]);
$fila = $stmt->fetch();

if (!$fila) {
    responder(['error' => 'Token SSO inválido, ya usado o expirado'], 401);
}

// Marcar como usado (un solo uso)
$db->prepare("UPDATE tokens_sso SET usado = 1 WHERE id = ?")
   ->execute([$fila['id']]);

// Generar un JWT para App B (así App B puede autenticar requests futuros)
$payload = [
    'sub'        => $fila['usuario_id'],
    'nombre'     => $fila['nombre'],
    'email'      => $fila['email'],
    'rol'        => $fila['rol'],
    'app_origen' => $fila['app_origen'],
    'via_sso'    => true,
    'iat'        => time(),
    'exp'        => time() + 3600  // 1 hora en App B
];
$jwtAppB = JWT::generar($payload, JWT_SECRET . '_app_b'); // clave distinta por app

responder([
    'autenticado' => true,
    'via_sso'     => true,
    'app_origen'  => $fila['app_origen'],
    'token'       => $jwtAppB,
    'usuario'     => [
        'id'     => $fila['usuario_id'],
        'nombre' => $fila['nombre'],
        'email'  => $fila['email'],
        'rol'    => $fila['rol'],
        'tema'   => $fila['tema'],
    ]
]);
