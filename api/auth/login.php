<?php
// ============================================================
//  FloreDesigns - Login
//  Archivo: api/auth/login.php
//
//  Que hace este archivo:
//  1. Recibe email y password del formulario de login
//  2. Verifica que el usuario no este bloqueado por brute force
//  3. Busca al usuario en la base de datos
//  4. Compara la password con el hash guardado (bcrypt)
//  5. Si hay MFA activo, genera un codigo y lo envia
//  6. Si todo esta bien, crea una sesion y genera el JWT
//  7. Regresa el JWT al navegador
// ============================================================

require_once __DIR__ . '/../config/database.php';
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
$body    = obtenerBodyJSON();
$email   = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

// Validacion basica: campos vacios
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
//  Cuenta los intentos fallidos recientes desde esta IP o email.
//  Si hay 5 o mas en los ultimos 15 minutos, bloquea.
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
        'error'   => 'Demasiados intentos fallidos. Espera ' . BLOQUEO_MINUTOS . ' minutos.',
        'bloqueado' => true
    ], 429); // 429 = Too Many Requests
}

// ============================================================
//  PASO 2: Buscar usuario en la base de datos
// ============================================================
$stmt = $db->prepare("
    SELECT u.*, r.nombre AS rol_nombre, r.permisos
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.email = ?
    LIMIT 1
");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// Si el usuario no existe, igual hacemos el verify para evitar
// timing attacks (el atacante no sabe si el email existe o no)
if (!$usuario) {
    password_verify($password, '$2y$12$invalidhashtopreventtimingattack');
    registrarIntento($db, $email, $ip, false, 'usuario_no_existe');
    responder(['error' => 'Credenciales incorrectas'], 401);
}

// Verificar que la cuenta este activa
if (!$usuario['activo']) {
    registrarIntento($db, $email, $ip, false, 'cuenta_inactiva');
    responder(['error' => 'Esta cuenta esta desactivada'], 403);
}

// ============================================================
//  PASO 3: Verificar la contrasena
//  password_verify compara el texto plano con el hash bcrypt
// ============================================================
if (!password_verify($password, $usuario['password_hash'])) {
    registrarIntento($db, $email, $ip, false, 'password_incorrecta');
    $restantes = MAX_INTENTOS_LOGIN - ($intentos + 1);
    responder([
        'error'     => 'Credenciales incorrectas',
        'intentos_restantes' => max(0, $restantes)
    ], 401);
}

// ============================================================
//  PASO 4: Si tiene MFA activo, generar y enviar codigo
//  No generamos el JWT todavia. Primero debe pasar el MFA.
// ============================================================
if ($usuario['mfa_activo']) {
    $codigo    = generarCodigoMFA();        // Genera 6 digitos aleatorios
    $codigoHash = password_hash($codigo, PASSWORD_BCRYPT);
    $expira    = date('Y-m-d H:i:s', strtotime('+' . MFA_EXPIRA_MINUTOS . ' minutes'));

    // Invalidar codigos MFA anteriores de este usuario
    $db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE usuario_id = ? AND usado = 0")
       ->execute([$usuario['id']]);

    // Guardar el nuevo codigo
    $stmt = $db->prepare("
        INSERT INTO mfa_codigos (usuario_id, codigo_hash, tipo, expira_en)
        VALUES (?, ?, 'email', ?)
    ");
    $stmt->execute([$usuario['id'], $codigoHash, $expira]);

    // En produccion aqui se enviaria el email real.
    // Por ahora lo guardamos en la DB y lo devolvemos
    // solo en modo desarrollo para que puedas probarlo.
    registrarIntento($db, $email, $ip, true, null);

    responder([
        'mfa_requerido' => true,
        'usuario_id'    => $usuario['id'],
        'mensaje'       => 'Se envio un codigo a tu correo.',
        // SOLO EN DESARROLLO - quitar en produccion:
        '_dev_codigo'   => $codigo
    ]);
}

// ============================================================
//  PASO 5: Login exitoso - crear sesion y JWT
// ============================================================
$sesionId    = generarUUID();
$userAgent   = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
$dispositivo = detectarDispositivo($userAgent);

// Crear la sesion en la base de datos
$stmt = $db->prepare("
    INSERT INTO sesiones (id, usuario_id, ip, user_agent, dispositivo)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([$sesionId, $usuario['id'], $ip, $userAgent, $dispositivo]);

// Generar JWT (token principal, dura 15 minutos)
$payload = [
    'sub'       => $usuario['id'],           // subject = id del usuario
    'nombre'    => $usuario['nombre'],
    'email'     => $usuario['email'],
    'rol'       => $usuario['rol_nombre'],
    'sesion_id' => $sesionId,
    'iat'       => time(),                   // issued at = cuando se creo
    'exp'       => time() + (JWT_EXPIRA_MINUTOS * 60) // expira en 15 min
];
$jwt = JWT::generar($payload, JWT_SECRET);

// Generar Refresh Token (dura 7 dias)
$refreshToken     = bin2hex(random_bytes(32));
$refreshTokenHash = hash('sha256', $refreshToken);
$refreshExpira    = date('Y-m-d H:i:s', strtotime('+' . JWT_REFRESH_DIAS . ' days'));

$stmt = $db->prepare("
    INSERT INTO refresh_tokens (usuario_id, sesion_id, token_hash, expira_en)
    VALUES (?, ?, ?, ?)
");
$stmt->execute([$usuario['id'], $sesionId, $refreshTokenHash, $refreshExpira]);

// Actualizar ultimo_login
$db->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?")
   ->execute([$usuario['id']]);

// Registrar intento exitoso
registrarIntento($db, $email, $ip, true, null);

// Responder con el JWT y datos del usuario
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
