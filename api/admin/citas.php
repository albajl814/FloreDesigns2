<?php
// api/admin/citas.php
// GET  → lista citas con datos del cliente
// POST { accion:'actualizar', id, estado, fecha, hora, notas_admin }
// POST { accion:'eliminar', id }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    responder(['ok' => true]); 
}

// Protección con roles
$usuarioToken = requireAuth(['admin','superadmin']);
$db = Database::conectar();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("
        SELECT c.id, c.tipo, c.fecha, c.hora, c.estado, c.comentarios,
               c.notas_admin, c.creado_en,
               u.id AS usuario_id, u.nombre AS cliente, u.email, u.telefono
        FROM citas c
        JOIN usuarios u ON u.id = c.usuario_id
        ORDER BY c.fecha DESC, c.hora DESC
    ");
    responder(['citas' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body  = obtenerBodyJSON();
    $accion = $body['accion'] ?? '';

    if ($accion === 'actualizar') {
        $stmt = $db->prepare("
            UPDATE citas SET estado=?, fecha=?, hora=?, notas_admin=? WHERE id=?
        ");
        $stmt->execute([
            $body['estado'] ?? 'pendiente',
            $body['fecha']  ?? null,
            $body['hora']   ?? null,
            $body['notas_admin'] ?? null,
            (int)$body['id']
        ]);
        responder(['mensaje' => 'Cita actualizada']);
    }

    if ($accion === 'eliminar') {
        if ($u['rol'] !== 'superadmin' && $u['rol'] !== 'admin') responder(['error' => 'Sin permisos'], 403);
        $db->prepare("DELETE FROM citas WHERE id=?")->execute([(int)$body['id']]);
        responder(['mensaje' => 'Cita eliminada']);
    }
}

responder(['error' => 'Método no permitido'], 405);