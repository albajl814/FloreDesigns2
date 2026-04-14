<?php
// ============================================================
//  FloreDesigns - Recuperación por preguntas secretas
//  Archivo: api/auth/reset-preguntas.php
//
//  Método 2 de 4.
//
//  Paso 1 — Obtener la pregunta del usuario:
//    GET /api/auth/reset-preguntas.php?email=usuario@gmail.com
//
//  Paso 2 — Verificar la respuesta:
//    POST /api/auth/reset-preguntas.php
//    Body: { "email": "...", "respuesta": "..." }
//    Si es correcta devuelve un token para cambiar la contraseña.
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }

// ── GET: devolver la pregunta secreta del usuario ──────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $email = trim($_GET['email'] ?? '');
    if (empty($email)) responder(['error' => 'Email requerido'], 400);

    $db   = Database::conectar();
    $stmt = $db->prepare("SELECT pregunta_secreta FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1");
    $stmt->execute([$email]);
    $fila = $stmt->fetch();

    if (!$fila || empty($fila['pregunta_secreta'])) {
        // No revelar si el email existe; devolver mensaje neutro
        responder(['pregunta' => null, 'mensaje' => 'Este usuario no tiene pregunta secreta configurada']);
    }

    responder(['pregunta' => $fila['pregunta_secreta']]);
}

// ── POST: verificar respuesta y emitir token de reset ─────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body     = obtenerBodyJSON();
    $email    = trim($body['email']    ?? '');
    $respuesta = trim($body['respuesta'] ?? '');

    if (empty($email) || empty($respuesta)) {
        responder(['error' => 'Email y respuesta son obligatorios'], 400);
    }

    $db  = Database::conectar();
    $ip  = obtenerIP();

    // Verificar intentos recientes (máx 5 en 15 min) para evitar fuerza bruta
    $ventana = date('Y-m-d H:i:s', strtotime('-15 minutes'));
    $stmt    = $db->prepare("
        SELECT COUNT(*) AS total FROM intentos_login
        WHERE ip = ? AND exitoso = 0 AND fecha >= ?
    ");
    $stmt->execute([$ip, $ventana]);
    if ($stmt->fetch()['total'] >= 5) {
        responder(['error' => 'Demasiados intentos. Espera 15 minutos.', 'bloqueado' => true], 429);
    }

    $stmt = $db->prepare("
        SELECT id, nombre, respuesta_secreta_hash
        FROM usuarios
        WHERE email = ? AND activo = 1 AND pregunta_secreta IS NOT NULL
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    // Siempre ejecutar password_verify para evitar timing attacks
    $hashFalso = '$2y$12$invalido.hash.para.evitar.timing.attacks.xxxx';
    $hashReal  = $usuario['respuesta_secreta_hash'] ?? $hashFalso;

    if (!$usuario || !password_verify(strtolower($respuesta), $hashReal)) {
        // Registrar intento fallido
        $db->prepare("INSERT INTO intentos_login (email, ip, exitoso, razon_fallo) VALUES (?, ?, 0, 'respuesta_secreta_incorrecta')")
           ->execute([$email, $ip]);
        responder(['error' => 'Respuesta incorrecta'], 401);
    }

    // Respuesta correcta → generar token de reset
    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expira    = date('Y-m-d H:i:s', strtotime('+' . RESET_EXPIRA_MINUTOS . ' minutes'));

    $db->prepare("UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND metodo = 'preguntas_secretas' AND usado = 0")
       ->execute([$usuario['id']]);

    $db->prepare("
        INSERT INTO password_resets (usuario_id, token_hash, metodo, expira_en, ip_solicitud)
        VALUES (?, ?, 'preguntas_secretas', ?, ?)
    ")->execute([$usuario['id'], $tokenHash, $expira, $ip]);

    responder([
        'mensaje' => 'Respuesta correcta',
        'token'   => $token   // El frontend usa este token para cambiar la contraseña
    ]);
}

responder(['error' => 'Método no permitido'], 405);
