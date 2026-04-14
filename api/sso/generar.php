<?php
// ============================================================
//  FloreDesigns - SSO: Generar token de acceso compartido
//  Archivo: api/sso/generar.php
//
//  El usuario autenticado en FloreDesigns (App A) solicita
//  un token SSO para acceder a App B sin volver a hacer login.
//
//  POST (requiere JWT válido de FloreDesigns)
//  Devuelve: { "sso_token": "...", "url_app_b": "..." }
// ============================================================
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { responder(['ok' => true]); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { responder(['error' => 'Método no permitido'], 405); }

$usuario = requireAuth(); // Verifica JWT de FloreDesigns
$db      = Database::conectar();

// Invalidar tokens SSO anteriores de este usuario
$db->prepare("UPDATE tokens_sso SET usado = 1 WHERE usuario_id = ? AND usado = 0")
   ->execute([$usuario['sub']]);

// Generar nuevo token SSO (válido 5 minutos, uso único)
$ssoToken     = bin2hex(random_bytes(32));
$ssoTokenHash = hash('sha256', $ssoToken);
$expira       = date('Y-m-d H:i:s', strtotime('+5 minutes'));

$db->prepare("
    INSERT INTO tokens_sso (usuario_id, token_hash, app_origen, expira_en)
    VALUES (?, ?, 'floredesigns', ?)
")->execute([$usuario['sub'], $ssoTokenHash, $expira]);

// URL de App B con el token en la query string
$urlAppB = "http://localhost/FloreDesigns2/app-b.html?sso_token=$ssoToken";

responder([
    'sso_token' => $ssoToken,
    'url_app_b' => $urlAppB,
    'expira_en' => $expira,
    'mensaje'   => 'Token SSO generado. Tienes 5 minutos para usarlo.'
]);
