<?php
// ============================================================
//  FloreDesigns - Implementacion JWT manual
//  Archivo: api/utils/jwt.php
//
//  JWT = JSON Web Token
//  Es una cadena con 3 partes separadas por puntos:
//
//    HEADER.PAYLOAD.FIRMA
//
//  Ejemplo real:
//    eyJhbGciOiJIUzI1NiJ9
//    .eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZmxvcmUuY29tIn0
//    .xXhZm3hBnGi_V1234abcXYZ
//
//  La FIRMA garantiza que nadie pudo modificar el token.
//  Si alguien cambia el payload, la firma ya no coincide
//  y el servidor lo rechaza.
// ============================================================

class JWT {

    /**
     * Genera un nuevo JWT firmado con HMAC-SHA256.
     *
     * @param array  $payload  Los datos a guardar (id, email, rol, etc.)
     * @param string $secret   La clave secreta del servidor
     * @return string          El token listo para enviar al cliente
     */
    public static function generar(array $payload, string $secret): string {
        // Parte 1: Header - indica el tipo y algoritmo
        $header = self::base64url(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]));

        // Parte 2: Payload - los datos del usuario
        $payload64 = self::base64url(json_encode($payload));

        // Parte 3: Firma - garantiza que el token no fue modificado
        $firma = self::base64url(
            hash_hmac('sha256', "$header.$payload64", $secret, true)
        );

        return "$header.$payload64.$firma";
    }

    /**
     * Verifica y decodifica un JWT.
     * Lanza Exception si el token es invalido o expirado.
     *
     * @param string $token   El token recibido del cliente
     * @param string $secret  La misma clave secreta usada para firmarlo
     * @return array          El payload decodificado
     */
    public static function verificar(string $token, string $secret): array {
        $partes = explode('.', $token);

        if (count($partes) !== 3) {
            throw new Exception('Token malformado');
        }

        [$header, $payload64, $firmaRecibida] = $partes;

        // Recalcular la firma y comparar
        $firmaEsperada = self::base64url(
            hash_hmac('sha256', "$header.$payload64", $secret, true)
        );

        // hash_equals es resistente a timing attacks
        if (!hash_equals($firmaEsperada, $firmaRecibida)) {
            throw new Exception('Firma invalida - token modificado');
        }

        // Decodificar el payload
        $payload = json_decode(base64_decode(strtr($payload64, '-_', '+/')), true);

        if (!$payload) {
            throw new Exception('Payload invalido');
        }

        // Verificar expiracion
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expirado');
        }

        return $payload;
    }

    /**
     * Extrae el payload SIN verificar la firma.
     * Util solo para leer datos cuando ya se sabe que el token es valido.
     * NUNCA usar para autenticar, solo para leer datos inofensivos.
     */
    public static function decodificarSinVerificar(string $token): array {
        $partes = explode('.', $token);
        if (count($partes) !== 3) return [];
        return json_decode(base64_decode(strtr($partes[1], '-_', '+/')), true) ?? [];
    }

    // Codificacion Base64 URL-safe (sin +, /, = que rompen las URLs)
    private static function base64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
