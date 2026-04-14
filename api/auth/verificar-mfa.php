<?php
// ============================================================
//  FloreDesigns - Verificar código MFA
//  Archivo: api/auth/verificar-mfa.php
//
//  Después de que login.php detecta MFA activo y genera el
//  código, el frontend manda el código de 6 dígitos aquí.
//
//  POST { "usuario_id": 1, "codigo": "482916" }
//  Devuelve: JWT + refresh_token (igual que login normal)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { responder(['error' => 'Método no permitido'], 405); }

$body      = obtenerBodyJSON();
$usuarioId = (int)($body['usuario_id'] ?? 0);
$codigo    = trim($body['codigo'] ?? '');

if (!$usuarioId || empty($codigo)) {
    responder(['error' => 'usuario_id y codigo son obligatorios'], 400);
}

$db = Database::conectar();

// Buscar el código MFA más reciente, válido y no usado
$stmt = $db->prepare("
    SELECT id, codigo_hash
    FROM mfa_codigos
    WHERE usuario_id = ?
      AND usado      = 0
      AND expira_en  > NOW()
    ORDER BY id DESC
    LIMIT 1
");
$stmt->execute([$usuarioId]);
$mfa = $stmt->fetch();

if (!$mfa || !password_verify($codigo, $mfa['codigo_hash'])) {
    responder(['error' => 'Código incorrecto o expirado'], 401);
}

// Marcar código como usado
$db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE id = ?")
   ->execute([$mfa['id']]);

// Cargar datos del usuario
$stmt = $db->prepare("
    SELECT u.*, r.nombre AS rol_nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = ? AND u.activo = 1
    LIMIT 1
");
$stmt->execute([$usuarioId]);
$usuario = $stmt->fetch();

if (!$usuario) {
    responder(['error' => 'Usuario no encontrado'], 404);
}

// Crear sesión
$sesionId    = generarUUID();
$userAgent   = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
$dispositivo = detectarDispositivo($userAgent);
$ip          = obtenerIP();

$db->prepare("
    INSERT INTO sesiones (id, usuario_id, ip, user_agent, dispositivo)
    VALUES (?, ?, ?, ?, ?)
")->execute([$sesionId, $usuario['id'], $ip, $userAgent, $dispositivo]);

// Generar JWT
$payload = [
    'sub'       => $usuario['id'],
    'nombre'    => $usuario['nombre'],
    'email'     => $usuario['email'],
    'rol'       => $usuario['rol_nombre'],
    'sesion_id' => $sesionId,
    'iat'       => time(),
    'exp'       => time() + (JWT_EXPIRA_MINUTOS * 60)
];
$jwt = JWT::generar($payload, JWT_SECRET);

// Generar Refresh Token
$refreshToken     = bin2hex(random_bytes(32));
$refreshTokenHash = hash('sha256', $refreshToken);
$refreshExpira    = date('Y-m-d H:i:s', strtotime('+' . JWT_REFRESH_DIAS . ' days'));

$db->prepare("
    INSERT INTO refresh_tokens (usuario_id, sesion_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
")->execute([$usuario['id'], $sesionId, $refreshTokenHash, $refreshExpira]);

$db->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?")
   ->execute([$usuario['id']]);

responder([
    'token'         => $jwt,
    'refresh_token' => $refreshToken,
    'sesion_id'     => $sesionId,
    'usuario'       => [
        'id'     => $usuario['id'],
        'nombre' => $usuario['nombre'],
        'email'  => $usuario['email'],
        'rol'    => $usuario['rol_nombre'],
        'tema'   => $usuario['tema'],
    ]
]);