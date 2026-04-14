<?php
// ============================================================
//  FloreDesigns - Activar / Desactivar MFA y pregunta secreta
//  Archivo: api/perfil/seguridad.php
//
//  POST { "accion": "activar_mfa" }
//  POST { "accion": "desactivar_mfa" }
//  POST { "accion": "guardar_pregunta", "pregunta": "...", "respuesta": "..." }
// ============================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { responder(['error' => 'Método no permitido'], 405); }

$usuario = requireAuth();
$db      = Database::conectar();
$body    = obtenerBodyJSON();
$accion  = $body['accion'] ?? '';

// ── Activar MFA ───────────────────────────────────────────────
if ($accion === 'activar_mfa') {
    $db->prepare("UPDATE usuarios SET mfa_activo = 1 WHERE id = ?")
       ->execute([$usuario['sub']]);
    responder(['mensaje' => 'MFA activado. A partir de ahora recibirás un código al iniciar sesión.']);
}

// ── Desactivar MFA ────────────────────────────────────────────
if ($accion === 'desactivar_mfa') {
    $db->prepare("UPDATE usuarios SET mfa_activo = 0 WHERE id = ?")
       ->execute([$usuario['sub']]);
    responder(['mensaje' => 'MFA desactivado.']);
}

// ── Guardar pregunta secreta ──────────────────────────────────
if ($accion === 'guardar_pregunta') {
    $pregunta  = trim($body['pregunta']  ?? '');
    $respuesta = trim($body['respuesta'] ?? '');

    if (empty($pregunta) || empty($respuesta)) {
        responder(['error' => 'Pregunta y respuesta son obligatorias'], 400);
    }
    if (strlen($pregunta) < 10) {
        responder(['error' => 'La pregunta debe ser más descriptiva (mínimo 10 caracteres)'], 400);
    }

    // Guardar respuesta como hash bcrypt (nunca en texto plano)
    $respuestaHash = password_hash(strtolower($respuesta), PASSWORD_BCRYPT);

    $db->prepare("UPDATE usuarios SET pregunta_secreta = ?, respuesta_secreta_hash = ? WHERE id = ?")
       ->execute([$pregunta, $respuestaHash, $usuario['sub']]);

    responder(['mensaje' => 'Pregunta de seguridad guardada correctamente.']);
}

responder(['error' => 'Acción no reconocida'], 400);
