<?php
// ============================================================
//  FloreDesigns - Cambiar contraseña desde perfil
//  Archivo: api/perfil/cambiar-password.php
//
//  POST { "password_actual": "...", "password_nuevo": "..." }
// ============================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { responder(['error' => 'Método no permitido'], 405); }

$usuario = requireAuth();
$db      = Database::conectar();
$body    = obtenerBodyJSON();

$passActual = $body['password_actual'] ?? '';
$passNuevo  = $body['password_nuevo']  ?? '';

if (empty($passActual) || empty($passNuevo)) {
    responder(['error' => 'Ambas contraseñas son obligatorias'], 400);
}

// Validar nueva contraseña
if (strlen($passNuevo) < 8)                  responder(['error' => 'Mínimo 8 caracteres'], 400);
if (!preg_match('/[A-Z]/', $passNuevo))      responder(['error' => 'Debe tener al menos una mayúscula'], 400);
if (!preg_match('/[0-9]/', $passNuevo))      responder(['error' => 'Debe tener al menos un número'], 400);

// Obtener hash actual
$stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
$stmt->execute([$usuario['sub']]);
$fila = $stmt->fetch();

if (!$fila || !password_verify($passActual, $fila['password_hash'])) {
    responder(['error' => 'La contraseña actual es incorrecta'], 401);
}

// Actualizar
$nuevoHash = password_hash($passNuevo, PASSWORD_BCRYPT, ['cost' => 12]);
$db->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?")
   ->execute([$nuevoHash, $usuario['sub']]);

// Cerrar otras sesiones por seguridad (mantener la actual)
$db->prepare("UPDATE sesiones SET activa = 0 WHERE usuario_id = ? AND id != ?")
   ->execute([$usuario['sub'], $usuario['sesion_id']]);
$db->prepare("UPDATE refresh_tokens SET revocado = 1 WHERE usuario_id = ? AND sesion_id != ?")
   ->execute([$usuario['sub'], $usuario['sesion_id']]);

responder(['mensaje' => 'Contraseña actualizada. Las demás sesiones fueron cerradas.']);
