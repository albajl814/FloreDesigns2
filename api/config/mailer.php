<?php

define('MAIL_HOST',     'smtp.gmail.com');
define('MAIL_PORT',     587);
define('MAIL_USER',     'julialbaal@gmail.com');       // <-- cambia esto
define('MAIL_PASS',     'joaa yhma bbwq ooto');        // <-- contraseña de app de Google
define('MAIL_FROM',     'julialbaal@gmail.com');        // <-- igual que MAIL_USER
define('MAIL_FROM_NAME','Flore Designs');

// ============================================================
//  FUNCIÓN: enviarCorreo
//  Envía un email usando PHPMailer + Gmail SMTP.
//
//  Uso:
//    enviarCorreo('dest@gmail.com', 'Asunto', '<p>HTML del cuerpo</p>');
//
//  Devuelve true si se envió, false si falló.
// ============================================================
function enviarCorreo(string $destinatario, string $asunto, string $cuerpoHTML): bool {
    // Ruta a PHPMailer (instalada en vendor/ dentro de la carpeta api)
    $autoload = __DIR__ . "/../../vendor/autoload.php";

    if (!file_exists($autoload)) {
        // Si no existe vendor/, intentar cargar PHPMailer manualmente
        $base = __DIR__ . '/../../vendor/phpmailer/phpmailer/src/';
        if (!file_exists($base . 'PHPMailer.php')) {
            error_log('PHPMailer no encontrado. Ejecuta: composer require phpmailer/phpmailer');
            return false;
        }
        require_once $base . 'Exception.php';
        require_once $base . 'PHPMailer.php';
        require_once $base . 'SMTP.php';
    } else {
        require_once $autoload;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        // Configuración SMTP
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USER;
        $mail->Password   = MAIL_PASS;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;
        $mail->CharSet    = 'UTF-8';

        // Remitente y destinatario
        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $mail->addAddress($destinatario);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $cuerpoHTML;
        $mail->AltBody = strip_tags($cuerpoHTML); // versión texto plano

        $mail->send();
        return true;

    } catch (\Exception $e) {
        error_log('Error enviando correo: ' . $e->getMessage());
        return false;
    }
}

// ============================================================
//  PLANTILLA HTML para emails de recuperación
// ============================================================
function plantillaEmail(string $titulo, string $cuerpo): string {
    return "
    <div style='font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;
                background: #fff; border-radius: 12px; overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
        <div style='background: linear-gradient(135deg, #c8956c, #a0644a);
                    padding: 28px 32px; text-align: center;'>
            <h1 style='color: #fff; margin: 0; font-size: 22px;'>🌸 Flore Designs</h1>
        </div>
        <div style='padding: 32px;'>
            <h2 style='color: #333; margin-top: 0;'>$titulo</h2>
            $cuerpo
            <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;'>
            <p style='color: #999; font-size: 12px; margin: 0;'>
                Si no solicitaste esto, ignora este mensaje.<br>
                Este correo fue generado automáticamente por Flore Designs.
            </p>
        </div>
    </div>";
}
