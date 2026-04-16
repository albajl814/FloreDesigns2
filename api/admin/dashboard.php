<?php
// api/admin/dashboard.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

// Protección de ruta
$u = requireAuth(['admin','superadmin']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }

$u = requireAuth();
if (!in_array($u['rol'], ['admin','superadmin'])) responder(['error' => 'Acceso denegado'], 403);

$db = Database::conectar();

// Citas pendientes
$citas = $db->query("SELECT COUNT(*) AS total FROM citas WHERE estado = 'pendiente'")->fetch()['total'] ?? 0;

// Pedidos activos
$pedidos = $db->query("SELECT COUNT(*) AS total FROM pedidos WHERE estado NOT IN ('entregado','cancelado')")->fetch()['total'] ?? 0;

// Clientes nuevos este mes
$clientes = $db->query("
    SELECT COUNT(*) AS total FROM usuarios
    WHERE rol_id = (SELECT id FROM roles WHERE nombre='cliente')
    AND MONTH(creado_en) = MONTH(NOW()) AND YEAR(creado_en) = YEAR(NOW())
")->fetch()['total'] ?? 0;

// Total usuarios
$totalUsuarios = $db->query("SELECT COUNT(*) AS total FROM usuarios")->fetch()['total'] ?? 0;

// Actividad reciente: últimas 5 citas + pedidos mezclados
$actividad = [];

$stmt = $db->query("
    SELECT c.id, c.tipo, c.estado, c.creado_en, u.nombre AS cliente
    FROM citas c JOIN usuarios u ON u.id = c.usuario_id
    ORDER BY c.creado_en DESC LIMIT 5
");
foreach ($stmt->fetchAll() as $row) {
    $actividad[] = ['tipo'=>'cita','texto'=>'Cita de '.$row['cliente'].' — '.$row['tipo'],'estado'=>$row['estado'],'fecha'=>$row['creado_en']];
}

$stmt = $db->query("
    SELECT p.id, p.titulo, p.estado, p.creado_en, u.nombre AS cliente
    FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id
    ORDER BY p.creado_en DESC LIMIT 5
");
foreach ($stmt->fetchAll() as $row) {
    $actividad[] = ['tipo'=>'pedido','texto'=>'Pedido de '.$row['cliente'].' — '.$row['titulo'],'estado'=>$row['estado'],'fecha'=>$row['creado_en']];
}

usort($actividad, fn($a,$b) => strtotime($b['fecha']) - strtotime($a['fecha']));

responder([
    'stats' => [
        'citas_pendientes' => (int)$citas,
        'pedidos_activos'  => (int)$pedidos,
        'clientes_nuevos'  => (int)$clientes,
        'total_usuarios'   => (int)$totalUsuarios,
    ],
    'actividad' => array_slice($actividad, 0, 6)
]);