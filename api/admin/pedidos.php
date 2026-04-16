<?php
// api/admin/pedidos.php
// GET  → lista pedidos
// POST { accion:'actualizar', id, estado, notas_admin }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }

$usuarioToken = requireAuth(['admin','superadmin']);
$db = Database::conectar();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("
        SELECT p.id, p.titulo, p.descripcion, p.estado, p.precio,
               p.fecha_evento, p.creado_en, p.notas_admin,
               u.nombre AS cliente, u.email, u.telefono
        FROM pedidos p
        JOIN usuarios u ON u.id = p.usuario_id
        ORDER BY p.creado_en DESC
    ");
    responder(['pedidos' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body   = obtenerBodyJSON();
    $accion = $body['accion'] ?? '';

    if ($accion === 'actualizar') {
        $estados = ['cotizacion','diseno','confeccion','prueba','ajustes','listo','entregado','cancelado'];
        $estado  = in_array($body['estado'], $estados) ? $body['estado'] : 'cotizacion';
        $stmt = $db->prepare("UPDATE pedidos SET estado=?, notas_admin=? WHERE id=?");
        $stmt->execute([$estado, $body['notas_admin'] ?? null, (int)$body['id']]);
        responder(['mensaje' => 'Pedido actualizado']);
    }
}

responder(['error' => 'Método no permitido'], 405);