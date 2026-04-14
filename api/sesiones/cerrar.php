<?php
// ============================================================
//  FloreDesigns - Cerrar sesion especifica
//  Archivo: api/sesiones/cerrar.php
//
//  Permite cerrar una sesion en otro dispositivo sin afectar
//  la sesion actual. O cerrar TODAS las sesiones.
//
//  Body JSON:
//    { "sesion_id": "uuid-de-la-sesion" }   <- cerrar una
//    { "todas": true }                       <- cerrar todas menos la actual
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['error' => 'Metodo no permitido'], 405);
}

$usuarioToken = requireAuth();
$db           = Database::conectar();
$body         = obtenerBodyJSON();

$cerrarTodas = $body['todas'] ?? false;
$sesionACerrar = $body['sesion_id'] ?? null;

if ($cerrarTodas) {
    // Cerrar todas excepto la sesion actual
    $stmt = $db->prepare("
        UPDATE sesiones
        SET activa = 0
        WHERE usuario_id = ? AND id != ?
    ");
    $stmt->execute([$usuarioToken['sub'], $usuarioToken['sesion_id']]);

    // Revocar todos los refresh tokens de esas sesiones
    $db->prepare("
        UPDATE refresh_tokens
        SET revocado = 1
        WHERE usuario_id = ? AND sesion_id != ?
    ")->execute([$usuarioToken['sub'], $usuarioToken['sesion_id']]);

    responder(['mensaje' => 'Todas las demas sesiones fueron cerradas']);

} elseif ($sesionACerrar) {
    // Verificar que la sesion pertenece a este usuario (seguridad!)
    $stmt = $db->prepare("
        SELECT id FROM sesiones
        WHERE id = ? AND usuario_id = ? AND activa = 1
    ");
    $stmt->execute([$sesionACerrar, $usuarioToken['sub']]);

    if (!$stmt->fetch()) {
        responder(['error' => 'Sesion no encontrada'], 404);
    }

    // Cerrar esa sesion especifica
    $db->prepare("UPDATE sesiones SET activa = 0 WHERE id = ?")
       ->execute([$sesionACerrar]);

    // Revocar su refresh token
    $db->prepare("UPDATE refresh_tokens SET revocado = 1 WHERE sesion_id = ?")
       ->execute([$sesionACerrar]);

    responder(['mensaje' => 'Sesion cerrada correctamente']);

} else {
    responder(['error' => 'Indica sesion_id o todas:true'], 400);
}
