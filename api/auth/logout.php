<?php
// ============================================================
//  FloreDesigns - Cerrar sesion
//  Archivo: api/auth/logout.php
//
//  Que hace:
//  1. Verifica el JWT del usuario
//  2. Marca la sesion como inactiva en la BD
//  3. Revoca el refresh token
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    responder(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['error' => 'Metodo no permitido'], 405);
}

// Verificar que el token sea valido
$usuario = requireAuth();

$db = Database::conectar();

// Marcar la sesion como inactiva
$stmt = $db->prepare("UPDATE sesiones SET activa = 0 WHERE id = ?");
$stmt->execute([$usuario['sesion_id']]);

// Revocar los refresh tokens de esta sesion
$stmt = $db->prepare("UPDATE refresh_tokens SET revocado = 1 WHERE sesion_id = ?");
$stmt->execute([$usuario['sesion_id']]);

responder(['mensaje' => 'Sesion cerrada correctamente']);
