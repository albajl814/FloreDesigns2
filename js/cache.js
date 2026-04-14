/* =====================================================
   MODULO DE CACHE - cache.js
   Implementa un cache manual en memoria para evitar
   llamadas repetidas a la API.
   Practica 2 - Optimizacion
===================================================== */

const CacheModule = (() => {

    // Almacen interno: objeto clave -> { datos, timestamp }
    const almacen = {};

    // Tiempo de vida del cache en milisegundos (2 minutos)
    const TTL = 2 * 60 * 1000;

    /* --------------------------------------------------
       GUARDAR en cache
       clave: string identificador (ej: "usuarios-pagina-1")
       datos: cualquier valor a almacenar
    -------------------------------------------------- */
    const guardar = (clave, datos) => {
        almacen[clave] = {
            datos: datos,
            timestamp: Date.now()
        };
    };

    /* --------------------------------------------------
       OBTENER desde cache
       Devuelve los datos si existen y no han expirado.
       Devuelve null si no existe o si ya expiro.
    -------------------------------------------------- */
    const obtener = (clave) => {
        const entrada = almacen[clave];

        if (!entrada) return null;

        const ahora = Date.now();
        const estaVencido = (ahora - entrada.timestamp) > TTL;

        if (estaVencido) {
            delete almacen[clave];
            return null;
        }

        return entrada.datos;
    };

    /* --------------------------------------------------
       VERIFICAR si existe una clave valida en cache
    -------------------------------------------------- */
    const existe = (clave) => {
        return obtener(clave) !== null;
    };

    /* --------------------------------------------------
       LIMPIAR todo el cache o una clave especifica
    -------------------------------------------------- */
    const limpiar = (clave) => {
        if (clave) {
            delete almacen[clave];
        } else {
            Object.keys(almacen).forEach(k => delete almacen[k]);
        }
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        guardar,
        obtener,
        existe,
        limpiar
    };

})();
