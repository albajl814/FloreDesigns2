<?php
//  FloreDesigns - Registro de usuarios
//  Archivo: api/auth/register.php
//
//  Que hace este archivo:
//  1. Recibe nombre, email y password del formulario de registro
//  2. Valida que los datos sean correctos
//  3. Verifica que el email no este ya registrado
//  4. Hace hash de la contrasena con bcrypt
//  5. Crea el usuario en la base de datos
//  6. Devuelve confirmacion (sin JWT, debe hacer login por separado)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    responder(['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['error' => 'Metodo no permitido'], 405);
}

$body     = obtenerBodyJSON();
$nombre   = trim($body['nombre']   ?? '');
$email    = trim($body['email']    ?? '');
$password = $body['password']      ?? '';
$telefono = trim($body['telefono'] ?? '');

// -- Validaciones -------------------------------------------

if (empty($nombre) || empty($email) || empty($password)) {
    responder(['error' => 'Nombre, email y contrasena son obligatorios'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(['error' => 'El formato del email no es valido'], 400);
}

// La contrasena debe tener al menos 8 caracteres, una mayuscula y un numero
if (strlen($password) < 8) {
    responder(['error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
}
if (!preg_match('/[A-Z]/', $password)) {
    responder(['error' => 'La contrasena debe tener al menos una letra mayuscula'], 400);
}
if (!preg_match('/[0-9]/', $password)) {
    responder(['error' => 'La contrasena debe tener al menos un numero'], 400);
}

// -- Verificar si el email ya existe ------------------------
$db   = Database::conectar();
$stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
$stmt->execute([$email]);

if ($stmt->fetch()) {
    responder(['error' => 'Este email ya esta registrado'], 409); // 409 = Conflict
}

// -- Crear el hash de la contrasena -------------------------
// PASSWORD_BCRYPT con costo 12 es el estandar actual.
// Costo 12 significa que tarda ~250ms en generar el hash.
// Eso es lento para un humano (imperceptible) pero muy lento
// para un atacante que intenta millones de contrasenas.
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// -- Insertar el usuario ------------------------------------
$stmt = $db->prepare("
    INSERT INTO usuarios (nombre, email, password_hash, rol_id, telefono)
    VALUES (?, ?, ?, 3, ?)
");
// rol_id = 3 = cliente (todos los nuevos son clientes por defecto)
$stmt->execute([$nombre, $email, $passwordHash, $telefono ?: null]);

$nuevoId = $db->lastInsertId();

responder([
    'mensaje'    => 'Usuario registrado correctamente',
    'usuario_id' => $nuevoId,
    'email'      => $email
], 201); // 201 = Created
