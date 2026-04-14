<?php
// ============================================================
//  FloreDesigns - Gestión de usuarios (solo superadmin/admin)
//  Archivo: api/admin/usuarios.php
//
//  GET  → lista todos los usuarios con su rol
//  POST { usuario_id, nuevo_rol } → cambia el rol de un usuario
//
//  Seguridad:
//  - Requiere JWT válido (requireAuth)
//  - Solo superadmin puede cambiar roles a superadmin
//  - Nadie puede cambiar su propio rol
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }

// Verificar autenticación
$usuarioToken = requireAuth();
$rolActual    = $usuarioToken['rol'];

// Solo admin y superadmin pueden acceder
if (!in_array($rolActual, ['admin', 'superadmin'])) {
    responder(['error' => 'Acceso denegado. Se requiere rol de administrador.'], 403);
}

$db = Database::conectar();

// ── GET: Listar todos los usuarios ────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $stmt = $db->prepare("
        SELECT
            u.id,
            u.nombre,
            u.email,
            u.activo,
            u.ultimo_login,
            u.creado_en,
            r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        ORDER BY u.creado_en DESC
    ");
    $stmt->execute();
    $usuarios = $stmt->fetchAll();

    responder(['usuarios' => $usuarios]);
}

// ── POST: Cambiar rol de un usuario ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $body      = obtenerBodyJSON();
    $objetivoId = (int)($body['usuario_id'] ?? 0);
    $nuevoRol   = trim($body['nuevo_rol']   ?? '');

    // Validaciones básicas
    if (!$objetivoId || empty($nuevoRol)) {
        responder(['error' => 'usuario_id y nuevo_rol son obligatorios.'], 400);
    }

    $rolesValidos = ['cliente', 'editor', 'admin', 'superadmin'];
    if (!in_array($nuevoRol, $rolesValidos)) {
        responder(['error' => 'Rol inválido. Usa: cliente, editor, admin o superadmin.'], 400);
    }

    // No se puede cambiar el propio rol
    if ($objetivoId === (int)$usuarioToken['sub']) {
        responder(['error' => 'No puedes cambiar tu propio rol.'], 403);
    }

    // Solo superadmin puede asignar el rol superadmin
    if ($nuevoRol === 'superadmin' && $rolActual !== 'superadmin') {
        responder(['error' => 'Solo el superadmin puede asignar ese rol.'], 403);
    }

    // Verificar que el usuario objetivo existe
    $stmt = $db->prepare("SELECT id FROM usuarios WHERE id = ? LIMIT 1");
    $stmt->execute([$objetivoId]);
    if (!$stmt->fetch()) {
        responder(['error' => 'Usuario no encontrado.'], 404);
    }

    // Obtener el id del nuevo rol
    $stmt = $db->prepare("SELECT id FROM roles WHERE nombre = ? LIMIT 1");
    $stmt->execute([$nuevoRol]);
    $rolRow = $stmt->fetch();
    if (!$rolRow) {
        responder(['error' => 'Rol no encontrado en la base de datos.'], 500);
    }

    // Actualizar
    $stmt = $db->prepare("UPDATE usuarios SET rol_id = ? WHERE id = ?");
    $stmt->execute([$rolRow['id'], $objetivoId]);

    responder([
        'mensaje'     => 'Rol actualizado correctamente.',
        'usuario_id'  => $objetivoId,
        'nuevo_rol'   => $nuevoRol
    ]);
}

responder(['error' => 'Método no permitido.'], 405);