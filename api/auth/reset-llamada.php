<?php
// ============================================================
//  FloreDesigns - Recuperación por llamada (simulada)
//  Archivo: api/auth/reset-llamada.php
//
//  Método 4 de 4. Flujo completo de recuperación por llamada telefónica.
//
//  Paso 1 — POST { "email": "..." }             → genera código
//  Paso 2 — POST { "email": "...", "codigo": "..." } → verifica
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { responder(['error' => 'Método no permitido'], 405); }

$body   = obtenerBodyJSON();
$email  = trim($body['email']  ?? '');
$codigo = trim($body['codigo'] ?? '');

if (empty($email)) responder(['error' => 'Email requerido'], 400);

$db  = Database::conectar();
$ip  = obtenerIP();

// Brute force
$ventana = date('Y-m-d H:i:s', strtotime('-15 minutes'));
$stmt    = $db->prepare("SELECT COUNT(*) AS t FROM intentos_login WHERE ip = ? AND exitoso = 0 AND fecha >= ?");
$stmt->execute([$ip, $ventana]);
if ($stmt->fetch()['t'] >= 5) {
    responder(['error' => 'Demasiados intentos. Espera 15 minutos.', 'bloqueado' => true], 429);
}

$stmt = $db->prepare("SELECT id, nombre, telefono FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// ── PASO 1: generar código de voz ─────────────────────────
if (empty($codigo)) {
    if (!$usuario || empty($usuario['telefono'])) {
        responder(['error' => 'No hay número de teléfono registrado para este correo'], 404);
    }

    // Código de 6 dígitos pronunciable (solo dígitos, sin ambigüedades)
    $otp     = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    $otpHash = password_hash($otp, PASSWORD_BCRYPT);
    $expira  = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Usamos tipo 'totp' para distinguirlo del SMS en la tabla mfa_codigos
    $db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE usuario_id = ? AND tipo = 'totp' AND usado = 0")
       ->execute([$usuario['id']]);
    $db->prepare("INSERT INTO mfa_codigos (usuario_id, codigo_hash, tipo, expira_en) VALUES (?, ?, 'totp', ?)")
       ->execute([$usuario['id'], $otpHash, $expira]);

    // En producción aquí iría:
    // Twilio::calls()->create($usuario['telefono'], '+1TWILIO', [
    //     'twiml' => '<Response><Say>Tu código es ' . implode(' ', str_split($otp)) . '</Say></Response>'
    // ]);

    $tel     = $usuario['telefono'];
    $telMask = str_repeat('*', max(0, strlen($tel) - 4)) . substr($tel, -4);

    responder([
        'mensaje'     => "Recibirás una llamada al número $telMask con tu código",
        'telefono'    => $telMask,
        
    ]);
}

// ── PASO 2: verificar código de voz ───────────────────────
if (!$usuario) {
    responder(['error' => 'Usuario no encontrado'], 404);
}

$stmt = $db->prepare("
    SELECT id, codigo_hash, intentos FROM mfa_codigos
    WHERE usuario_id = ? AND tipo = 'totp' AND usado = 0 AND expira_en > NOW()
    ORDER BY fecha_creacion DESC LIMIT 1
");
$stmt->execute([$usuario['id']]);
$otpRow = $stmt->fetch();

if (!$otpRow) {
    responder(['error' => 'El código expiró o ya fue usado. Solicita uno nuevo.'], 410);
}

if ($otpRow['intentos'] >= 3) {
    $db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE id = ?")->execute([$otpRow['id']]);
    responder(['error' => 'Demasiados intentos. Solicita un nuevo código.'], 429);
}

if (!password_verify($codigo, $otpRow['codigo_hash'])) {
    $db->prepare("UPDATE mfa_codigos SET intentos = intentos + 1 WHERE id = ?")->execute([$otpRow['id']]);
    $restantes = 3 - ($otpRow['intentos'] + 1);
    responder(['error' => "Código incorrecto ($restantes intentos restantes)"], 401);
}

$db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE id = ?")->execute([$otpRow['id']]);

$token     = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$expira    = date('Y-m-d H:i:s', strtotime('+' . RESET_EXPIRA_MINUTOS . ' minutes'));

$db->prepare("UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND metodo = 'llamada' AND usado = 0")
   ->execute([$usuario['id']]);
$db->prepare("INSERT INTO password_resets (usuario_id, token_hash, metodo, expira_en, ip_solicitud) VALUES (?, ?, 'llamada', ?, ?)")
   ->execute([$usuario['id'], $tokenHash, $expira, $ip]);

responder(['mensaje' => 'Código verificado', 'token' => $token]);
