<?php
// ============================================================
//  FloreDesigns - Obtener / Actualizar datos del perfil
//  Archivo: api/perfil/datos.php
//
//  GET  → devuelve datos completos del usuario autenticado
//  POST → actualiza nombre, teléfono y preferencias
// ============================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }

$usuario = requireAuth();
$db      = Database::conectar();

// ── GET: devolver datos del usuario ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("
        SELECT u.id, u.nombre, u.email, u.telefono, u.mfa_activo,
               u.pregunta_secreta, u.tema, u.idioma,
               u.fecha_registro, u.ultimo_login, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE u.id = ?
    ");
    $stmt->execute([$usuario['sub']]);
    $datos = $stmt->fetch();

    if (!$datos) responder(['error' => 'Usuario no encontrado'], 404);

    // No devolver hashes ni datos sensibles
    unset($datos['password_hash'], $datos['respuesta_secreta_hash']);
    responder($datos);
}

// ── POST: actualizar datos ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body     = obtenerBodyJSON();
    $nombre   = trim($body['nombre']   ?? '');
    $telefono = trim($body['telefono'] ?? '');
    $tema     = $body['tema']     ?? null;
    $idioma   = $body['idioma']   ?? null;

    if (empty($nombre)) responder(['error' => 'El nombre es obligatorio'], 400);

    // Validar tema e idioma si vienen
    $temasValidos  = ['claro', 'oscuro'];
    $idiomasValidos = ['es', 'en'];
    if ($tema   && !in_array($tema,   $temasValidos))   $tema   = null;
    if ($idioma && !in_array($idioma, $idiomasValidos)) $idioma = null;

    $campos = ['nombre = ?', 'telefono = ?'];
    $vals   = [$nombre, $telefono ?: null];

    if ($tema)   { $campos[] = 'tema = ?';   $vals[] = $tema;   }
    if ($idioma) { $campos[] = 'idioma = ?'; $vals[] = $idioma; }

    $vals[] = $usuario['sub'];
    $db->prepare("UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id = ?")
       ->execute($vals);

    responder(['mensaje' => 'Perfil actualizado correctamente']);
}

responder(['error' => 'Método no permitido'], 405);
