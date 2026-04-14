<?php
// ============================================================
//  FloreDesigns - Recuperación por SMS
//  Archivo: api/auth/reset-sms.php
//
//  Método 3 de 4.
//  En producción real se integraría Twilio o similar.
//  Para esta práctica el código se guarda en BD y en modo
//  El código OTP se genera y se envía por el canal correspondiente.
//
//  Paso 1 — Solicitar código:
//    POST { "email": "..." }         → genera OTP, "lo envía"
//
//  Paso 2 — Verificar código:
//    POST { "email": "...", "codigo": "123456" }  → devuelve token
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

// Verificar brute force
$ventana = date('Y-m-d H:i:s', strtotime('-15 minutes'));
$stmt    = $db->prepare("SELECT COUNT(*) AS t FROM intentos_login WHERE ip = ? AND exitoso = 0 AND fecha >= ?");
$stmt->execute([$ip, $ventana]);
if ($stmt->fetch()['t'] >= 5) {
    responder(['error' => 'Demasiados intentos. Espera 15 minutos.', 'bloqueado' => true], 429);
}

// Buscar usuario con teléfono registrado
$stmt = $db->prepare("SELECT id, nombre, telefono FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// ── Sin codigo: PASO 1 → generar y "enviar" OTP ───────────
if (empty($codigo)) {
    if (!$usuario || empty($usuario['telefono'])) {
        responder(['error' => 'No hay número de teléfono registrado para este correo'], 404);
    }

    $otp      = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpHash  = password_hash($otp, PASSWORD_BCRYPT);
    $expira   = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Guardar en mfa_codigos (reutilizamos la tabla para OTP de reset)
    $db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE usuario_id = ? AND tipo = 'sms' AND usado = 0")
       ->execute([$usuario['id']]);

    $db->prepare("INSERT INTO mfa_codigos (usuario_id, codigo_hash, tipo, expira_en) VALUES (?, ?, 'sms', ?)")
       ->execute([$usuario['id'], $otpHash, $expira]);

    // Aquí iría: Twilio::sendSMS($usuario['telefono'], "Tu código Flore Designs: $otp");

    // Enmascarar el teléfono para mostrarlo al usuario (ej: ***-***-7890)
    $tel = $usuario['telefono'];
    $telMask = str_repeat('*', max(0, strlen($tel) - 4)) . substr($tel, -4);

    responder([
        'mensaje'     => "Código enviado al número $telMask",
        'telefono'    => $telMask,
        
    ]);
}

// ── Con codigo: PASO 2 → verificar OTP ───────────────────
if (!$usuario) {
    responder(['error' => 'Usuario no encontrado'], 404);
}

$stmt = $db->prepare("
    SELECT id, codigo_hash, intentos FROM mfa_codigos
    WHERE usuario_id = ? AND tipo = 'sms' AND usado = 0 AND expira_en > NOW()
    ORDER BY fecha_creacion DESC LIMIT 1
");
$stmt->execute([$usuario['id']]);
$otpRow = $stmt->fetch();

if (!$otpRow) {
    responder(['error' => 'El código expiró o ya fue usado. Solicita uno nuevo.'], 410);
}

// Máximo 3 intentos por código
if ($otpRow['intentos'] >= 3) {
    $db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE id = ?")->execute([$otpRow['id']]);
    responder(['error' => 'Demasiados intentos. Solicita un nuevo código.'], 429);
}

if (!password_verify($codigo, $otpRow['codigo_hash'])) {
    $db->prepare("UPDATE mfa_codigos SET intentos = intentos + 1 WHERE id = ?")->execute([$otpRow['id']]);
    $restantes = 3 - ($otpRow['intentos'] + 1);
    responder(['error' => "Código incorrecto ($restantes intentos restantes)"], 401);
}

// Código correcto → marcar como usado y emitir token de reset
$db->prepare("UPDATE mfa_codigos SET usado = 1 WHERE id = ?")->execute([$otpRow['id']]);

$token     = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$expira    = date('Y-m-d H:i:s', strtotime('+' . RESET_EXPIRA_MINUTOS . ' minutes'));

$db->prepare("UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND metodo = 'sms' AND usado = 0")
   ->execute([$usuario['id']]);
$db->prepare("INSERT INTO password_resets (usuario_id, token_hash, metodo, expira_en, ip_solicitud) VALUES (?, ?, 'sms', ?, ?)")
   ->execute([$usuario['id'], $tokenHash, $expira, $ip]);

responder(['mensaje' => 'Código verificado', 'token' => $token]);
