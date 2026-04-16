<?php
// ============================================================
//  FloreDesigns - Login
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

// Solo acepta peticiones POST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    responder(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['error' => 'Metodo no permitido'], 405);
}

// -- Leer datos del body ------------------------------------
$body     = json_decode(file_get_contents("php://input"), true) ?? [];
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

// Validación básica
if (empty($email) || empty($password)) {
    responder(['error' => 'Email y contrasena son obligatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(['error' => 'Email invalido'], 400);
}

$db = Database::conectar();
$ip = obtenerIP();

// ============================================================
//  PASO 1: Verificar brute force
// ============================================================
$ventana = date('Y-m-d H:i:s', strtotime('-' . BLOQUEO_MINUTOS . ' minutes'));

$stmt = $db->prepare("
    SELECT COUNT(*) AS total
    FROM intentos_login
    WHERE (email = ? OR ip = ?)
      AND exitoso = 0
      AND fecha >= ?
");
$stmt->execute([$email, $ip, $ventana]);
$intentos = $stmt->fetch()['total'];

if ($intentos >= MAX_INTENTOS_LOGIN) {
    registrarIntento($db, $email, $ip, false, 'brute_force');
    responder([
        'error' => 'Demasiados intentos fallidos. Espera ' . BLOQUEO_MINUTOS . ' minutos.',
        'bloqueado' => true
    ], 429);
}

// ============================================================
//  PASO 2: Buscar usuario
// ============================================================
$stmt = $db->prepare("
    SELECT u.*, r.nombre AS rol_nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.email = ?
    LIMIT 1
");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario) {
    password_verify($password, '$2y$12$invalidhash');
    registrarIntento($db, $email, $ip, false, 'usuario_no_existe');
    responder(['error' => 'Credenciales incorrectas'], 401);
}

// Cuenta activa
if (!$usuario['activo']) {
    registrarIntento($db, $email, $ip, false, 'cuenta_inactiva');
    responder(['error' => 'Cuenta desactivada'], 403);
}

// ============================================================
//  PASO 3: Verificar contraseña
// ============================================================
if (!password_verify($password, $usuario['password_hash'])) {
    registrarIntento($db, $email, $ip, false, 'password_incorrecta');
    responder(['error' => 'Credenciales incorrectas'], 401);
}

// ============================================================
//  PASO 4: Login exitoso
// ============================================================
$sesionId    = generarUUID();
$userAgent   = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
$dispositivo = detectarDispositivo($userAgent);

// Guardar sesión
$stmt = $db->prepare("
    INSERT INTO sesiones (id, usuario_id, ip, user_agent, dispositivo)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([$sesionId, $usuario['id'], $ip, $userAgent, $dispositivo]);

// JWT
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

// Refresh token
$refreshToken = bin2hex(random_bytes(32));
$refreshHash  = hash('sha256', $refreshToken);
$expira       = date('Y-m-d H:i:s', strtotime('+' . JWT_REFRESH_DIAS . ' days'));

$stmt = $db->prepare("
    INSERT INTO refresh_tokens (usuario_id, sesion_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
");
$stmt->execute([$usuario['id'], $sesionId, $refreshHash, $expira]);

// Actualizar último login
$db->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?")
   ->execute([$usuario['id']]);

// Registrar intento exitoso
registrarIntento($db, $email, $ip, true, null);

// ============================================================
// LOG (IMPORTANTE PARA TU PRÁCTICA)
// ============================================================
file_put_contents(
    __DIR__ . '/../../logs.txt',
    date("Y-m-d H:i:s") . " LOGIN: " . $email . "\n",
    FILE_APPEND
);

// ============================================================
// RESPUESTA FINAL
// ============================================================
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