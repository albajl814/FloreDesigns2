<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

//Solo usuarios logueados
$u = requireAuth(['user','admin','superadmin']);

$db = Database::conectar();

// Obtener datos del usuario
$stmt = $db->prepare("
    SELECT id, nombre, email, tema
    FROM usuarios
    WHERE id = ?
");

$stmt->execute([$u['sub']]);

$usuario = $stmt->fetch();

// Respuesta
responder($usuario);