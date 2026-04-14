<?php
// ============================================================
//  FloreDesigns - Gestión de sesiones activas
//  Archivo: api/sesiones/listar.php
//
//  Permite al usuario ver desde qué dispositivos tiene
//  sesion activa. Es el módulo de "multisesiones" del profe.
//
//  Uso desde JavaScript:
//    fetch('/api/sesiones/listar.php', {
//      headers: { Authorization: 'Bearer ' + token }
//    })
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(['error' => 'Metodo no permitido'], 405);
}

// Verificar que venga con JWT valido
$usuarioToken = requireAuth();
$db           = Database::conectar();

$stmt = $db->prepare("
    SELECT
        id          AS sesion_id,
        ip,
        dispositivo,
        fecha_inicio,
        ultima_actividad,
        (id = ?)    AS es_esta_sesion
    FROM sesiones
    WHERE usuario_id = ? AND activa = 1
    ORDER BY ultima_actividad DESC
");
$stmt->execute([$usuarioToken['sesion_id'], $usuarioToken['sub']]);
$sesiones = $stmt->fetchAll();

// Formatear fechas para que sean mas legibles
foreach ($sesiones as &$s) {
    $s['es_esta_sesion'] = (bool)$s['es_esta_sesion'];
    $s['hace']           = tiempoTranscurrido($s['ultima_actividad']);
}

responder(['sesiones' => $sesiones]);

/**
 * Convierte una fecha a texto relativo.
 * Ej: "hace 5 minutos", "hace 2 horas"
 */
function tiempoTranscurrido(string $fecha): string {
    $diff = time() - strtotime($fecha);
    if ($diff < 60)        return 'hace unos segundos';
    if ($diff < 3600)      return 'hace ' . floor($diff/60) . ' minutos';
    if ($diff < 86400)     return 'hace ' . floor($diff/3600) . ' horas';
    return 'hace ' . floor($diff/86400) . ' dias';
}
