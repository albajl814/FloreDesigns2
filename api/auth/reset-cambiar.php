<?php
// ============================================================
//  FloreDesigns - Cambiar contraseña con token de reset
//  Archivo: api/auth/reset-cambiar.php
//
//  Paso final de TODOS los métodos de recuperación.
//  Recibe el token generado por cualquiera de los 4 métodos
//  y la nueva contraseña, y la actualiza en BD.
//
//  POST { "token": "...", "password": "NuevaPass123!" }
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { responder(['error' => 'Método no permitido'], 405); }

$body     = obtenerBodyJSON();
$token    = trim($body['token']    ?? '');
$password = $body['password']      ?? '';

if (empty($token) || empty($password)) {
    responder(['error' => 'Token y contraseña son obligatorios'], 400);
}

// Validar la nueva contraseña
if (strlen($password) < 8) {
    responder(['error' => 'La contraseña debe tener al menos 8 caracteres'], 400);
}
if (!preg_match('/[A-Z]/', $password)) {
    responder(['error' => 'La contraseña debe tener al menos una letra mayúscula'], 400);
}
if (!preg_match('/[0-9]/', $password)) {
    responder(['error' => 'La contraseña debe tener al menos un número'], 400);
}

$db        = Database::conectar();
$tokenHash = hash('sha256', $token);

// Buscar el token en BD (válido, no usado, no expirado)
$stmt = $db->prepare("
    SELECT id, usuario_id, metodo
    FROM password_resets
    WHERE token_hash = ? AND usado = 0 AND expira_en > NOW()
    LIMIT 1
");
$stmt->execute([$tokenHash]);
$reset = $stmt->fetch();

if (!$reset) {
    responder(['error' => 'El enlace es inválido o ya expiró. Solicita uno nuevo.'], 410);
}

// Actualizar la contraseña
$nuevoHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$db->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?")
   ->execute([$nuevoHash, $reset['usuario_id']]);

// Marcar el token como usado (no puede reutilizarse)
$db->prepare("UPDATE password_resets SET usado = 1 WHERE id = ?")
   ->execute([$reset['id']]);

// Cerrar TODAS las sesiones activas por seguridad
$db->prepare("UPDATE sesiones SET activa = 0 WHERE usuario_id = ?")
   ->execute([$reset['usuario_id']]);
$db->prepare("UPDATE refresh_tokens SET revocado = 1 WHERE usuario_id = ?")
   ->execute([$reset['usuario_id']]);

responder([
    'mensaje' => 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    'metodo'  => $reset['metodo']
]);
