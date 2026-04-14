<?php
/**
 * API REST de Búsqueda - Floré Designs
 * Simulación de API propia para búsqueda de vestidos
 * 
 * Método HTTP: GET
 * Endpoint: /api/search-api.php
 * Parámetros: 
 *   - q: término de búsqueda (string)
 *   - categoria: filtro por categoría (string)
 *   - precio_min: precio mínimo (number)
 *   - precio_max: precio máximo (number)
 *   - evento: tipo de evento (string)
 * 
 * Respuesta: JSON con resultados de búsqueda
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Base de datos simulada de vestidos
$vestidos_db = [
    [
        'id' => 1,
        'nombre' => 'Vestido de Novia Clásico',
        'descripcion' => 'Elegante vestido de novia con encaje francés y cola larga',
        'categoria' => 'novia',
        'evento' => 'boda',
        'precio' => 25000,
        'talla' => 'Personalizada',
        'color' => 'Blanco',
        'imagen' => 'vestido-novia-1.jpg',
        'disponible' => true
    ],
    [
        'id' => 2,
        'nombre' => 'Vestido de Gala Sirena',
        'descripcion' => 'Diseño sirena con pedrería y escote corazón',
        'categoria' => 'gala',
        'evento' => 'gala',
        'precio' => 18000,
        'talla' => 'Personalizada',
        'color' => 'Rojo',
        'imagen' => 'vestido-gala-1.jpg',
        'disponible' => true
    ],
    [
        'id' => 3,
        'nombre' => 'Vestido de XV Años Rosa',
        'descripcion' => 'Vestido de quince años estilo princesa con tul y cristales',
        'categoria' => 'xv-anos',
        'evento' => 'quince-anos',
        'precio' => 15000,
        'talla' => 'Personalizada',
        'color' => 'Rosa',
        'imagen' => 'vestido-xv-1.jpg',
        'disponible' => true
    ],
    [
        'id' => 4,
        'nombre' => 'Vestido de Novia Minimalista',
        'descripcion' => 'Diseño moderno y minimalista con satén italiano',
        'categoria' => 'novia',
        'evento' => 'boda',
        'precio' => 22000,
        'talla' => 'Personalizada',
        'color' => 'Marfil',
        'imagen' => 'vestido-novia-2.jpg',
        'disponible' => true
    ],
    [
        'id' => 5,
        'nombre' => 'Vestido Cóctel Negro',
        'descripcion' => 'Vestido corto elegante para eventos sociales',
        'categoria' => 'coctel',
        'evento' => 'coctel',
        'precio' => 8000,
        'talla' => 'Personalizada',
        'color' => 'Negro',
        'imagen' => 'vestido-coctel-1.jpg',
        'disponible' => true
    ],
    [
        'id' => 6,
        'nombre' => 'Vestido de Gala Largo',
        'descripcion' => 'Vestido largo con lentejuelas y escote en V',
        'categoria' => 'gala',
        'evento' => 'gala',
        'precio' => 20000,
        'talla' => 'Personalizada',
        'color' => 'Azul',
        'imagen' => 'vestido-gala-2.jpg',
        'disponible' => true
    ],
    [
        'id' => 7,
        'nombre' => 'Vestido de XV Años Azul',
        'descripcion' => 'Vestido de quince años con bordados florales',
        'categoria' => 'xv-anos',
        'evento' => 'quince-anos',
        'precio' => 16000,
        'talla' => 'Personalizada',
        'color' => 'Azul cielo',
        'imagen' => 'vestido-xv-2.jpg',
        'disponible' => true
    ],
    [
        'id' => 8,
        'nombre' => 'Vestido de Novia Bohemio',
        'descripcion' => 'Estilo boho chic con encaje y manga larga',
        'categoria' => 'novia',
        'evento' => 'boda',
        'precio' => 23000,
        'talla' => 'Personalizada',
        'color' => 'Crema',
        'imagen' => 'vestido-novia-3.jpg',
        'disponible' => true
    ],
    [
        'id' => 9,
        'nombre' => 'Vestido Cóctel Fucsia',
        'descripcion' => 'Diseño juvenil y moderno para eventos casuales',
        'categoria' => 'coctel',
        'evento' => 'coctel',
        'precio' => 7500,
        'talla' => 'Personalizada',
        'color' => 'Fucsia',
        'imagen' => 'vestido-coctel-2.jpg',
        'disponible' => true
    ],
    [
        'id' => 10,
        'nombre' => 'Vestido de Madrina Elegante',
        'descripcion' => 'Vestido largo para madrina con detalles dorados',
        'categoria' => 'madrina',
        'evento' => 'boda',
        'precio' => 12000,
        'talla' => 'Personalizada',
        'color' => 'Verde esmeralda',
        'imagen' => 'vestido-madrina-1.jpg',
        'disponible' => true
    ]
];

// Obtener parámetros de búsqueda
$query = isset($_GET['q']) ? strtolower(trim($_GET['q'])) : '';
$categoria = isset($_GET['categoria']) ? strtolower(trim($_GET['categoria'])) : '';
$precio_min = isset($_GET['precio_min']) ? floatval($_GET['precio_min']) : 0;
$precio_max = isset($_GET['precio_max']) ? floatval($_GET['precio_max']) : PHP_INT_MAX;
$evento = isset($_GET['evento']) ? strtolower(trim($_GET['evento'])) : '';

// Función de búsqueda
function buscarVestidos($vestidos, $query, $categoria, $precio_min, $precio_max, $evento) {
    $resultados = [];
    
    foreach ($vestidos as $vestido) {
        $match = true;
        
        // Filtro por término de búsqueda
        if ($query !== '') {
            $textoCompleto = strtolower($vestido['nombre'] . ' ' . $vestido['descripcion'] . ' ' . $vestido['color']);
            if (strpos($textoCompleto, $query) === false) {
                $match = false;
            }
        }
        
        // Filtro por categoría
        if ($categoria !== '' && $categoria !== 'todas') {
            if ($vestido['categoria'] !== $categoria) {
                $match = false;
            }
        }
        
        // Filtro por rango de precio
        if ($vestido['precio'] < $precio_min || $vestido['precio'] > $precio_max) {
            $match = false;
        }
        
        // Filtro por tipo de evento
        if ($evento !== '' && $evento !== 'todos') {
            if ($vestido['evento'] !== $evento) {
                $match = false;
            }
        }
        
        if ($match) {
            $resultados[] = $vestido;
        }
    }
    
    return $resultados;
}

// Realizar búsqueda
$resultados = buscarVestidos($vestidos_db, $query, $categoria, $precio_min, $precio_max, $evento);

// Construir respuesta JSON
$response = [
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'query' => [
        'q' => $query,
        'categoria' => $categoria,
        'precio_min' => $precio_min,
        'precio_max' => $precio_max,
        'evento' => $evento
    ],
    'total_resultados' => count($resultados),
    'resultados' => $resultados,
    'metadata' => [
        'endpoint' => '/api/search-api.php',
        'metodo' => 'GET',
        'version' => '1.0',
        'autor' => 'Floré Designs API Team'
    ]
];

// Enviar respuesta
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
