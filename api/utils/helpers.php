<?php

require_once __DIR__ . '/jwt.php';

/**
 * Obtener header Authorization correctamente
 */
function getAuthorizationHeader() {
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        return $headers['Authorization'] ?? '';
    }

    return '';
}

/**
 * Respuesta JSON estándar
 */
function responder($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * AUTENTICACIÓN + AUTORIZACIÓN (RBAC)
 */
function requireAuth($rolesPermitidos = []) {

    // Obtener header Authorization
    $authHeader = getAuthorizationHeader();

    if (!$authHeader) {
        responder(['error' => 'No autorizado'], 401);
    }

    // Quitar "Bearer "
    $token = str_replace('Bearer ', '', $authHeader);

    try {
        // Decodificar JWT
        $payload = JWT::verificar($token, JWT_SECRET);

        // 🔐 VALIDAR ROLES
        if (!empty($rolesPermitidos) && !in_array($payload['rol'], $rolesPermitidos)) {
            responder(['error' => 'Acceso denegado'], 403);
        }

        return $payload;

    } catch (Exception $e) {
        responder(['error' => 'Token inválido'], 401);
    }
}

// ==============================
// FUNCIONES DE LOGIN
// ==============================

function obtenerIP() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function registrarIntento($db, $email, $ip, $exitoso, $motivo = null) {
    $stmt = $db->prepare("
        INSERT INTO intentos_login (email, ip, exitoso, motivo)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$email, $ip, $exitoso ? 1 : 0, $motivo]);
}

function generarCodigoMFA() {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function generarUUID() {
    return bin2hex(random_bytes(16));
}

function detectarDispositivo($userAgent) {
    if (strpos($userAgent, 'Mobile') !== false) return 'Mobile';
    if (strpos($userAgent, 'Tablet') !== false) return 'Tablet';
    return 'Desktop';
}