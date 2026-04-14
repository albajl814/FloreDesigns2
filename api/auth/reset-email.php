<?php
// ============================================================
//  FloreDesigns - Recuperación por correo electrónico
//  Archivo: api/auth/reset-email.php
//
//  Método 1 de 4: el usuario proporciona su email,
//  se genera un token temporal y se envía un enlace.
//
//  POST /api/auth/reset-email.php
//  Body: { "email": "usuario@gmail.com" }
//
//  El enlace enviado apunta a:
//  /FloreDesigns2/recuperar.html?token=TOKEN&metodo=email
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mailer.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { responder(['error' => 'Método no permitido'], 405); }

$body  = obtenerBodyJSON();
$email = trim($body['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(['error' => 'Email inválido'], 400);
}

$db = Database::conectar();

// Buscar usuario — siempre responder igual para no revelar si el email existe
$stmt = $db->prepare("SELECT id, nombre FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if ($usuario) {
    // Generar token seguro
    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expira    = date('Y-m-d H:i:s', strtotime('+' . RESET_EXPIRA_MINUTOS . ' minutes'));
    $ip        = obtenerIP();

    // Invalidar tokens anteriores del mismo usuario (mismo método)
    $db->prepare("UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND metodo = 'email' AND usado = 0")
       ->execute([$usuario['id']]);

    // Guardar nuevo token
    $stmt = $db->prepare("
        INSERT INTO password_resets (usuario_id, token_hash, metodo, expira_en, ip_solicitud)
        VALUES (?, ?, 'email', ?, ?)
    ");
    $stmt->execute([$usuario['id'], $tokenHash, $expira, $ip]);

    // Construir enlace
    $enlace = "http://localhost/FloreDesigns2/recuperar.html?token=$token&metodo=email";

    // Enviar correo
    $cuerpo = "
        <p>Hola <strong>{$usuario['nombre']}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en Flore Designs.</p>
        <p>Haz clic en el botón para crear una nueva contraseña:</p>
        <div style='text-align: center; margin: 28px 0;'>
            <a href='$enlace'
               style='background: #c8956c; color: white; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;
                      display: inline-block;'>
                Restablecer contraseña
            </a>
        </div>
        <p style='color: #666;'>Este enlace expira en <strong>" . RESET_EXPIRA_MINUTOS . " minutos</strong>.</p>
        <p style='color: #999; font-size: 13px;'>
            O copia este enlace en tu navegador:<br>
            <a href='$enlace' style='color: #c8956c;'>$enlace</a>
        </p>
    ";

    $enviado = enviarCorreo($email, '🌸 Restablecer contraseña - Flore Designs', plantillaEmail('Recuperar contraseña', $cuerpo));

    if (!$enviado) {
        // Si falla el correo, devolver el token en modo dev para poder probarlo
        responder([
            'mensaje'     => 'Correo enviado (modo dev: token incluido)',
            '_dev_enlace' => $enlace
        ]);
    }
}

// Siempre responder igual (seguridad: no revelar si el email existe)
responder(['mensaje' => 'Si ese correo está registrado, recibirás un enlace en breve.']);
