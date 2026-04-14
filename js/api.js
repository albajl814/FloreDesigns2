/* =====================================================
   MODULO DE API - api.js
   Responsable de todas las peticiones a APIs externas.
   Implementa: fetch asincrono, Promise.all, AbortController,
   debounce, cache, manejo de errores.
   Practica 2 - Implementacion asincrona avanzada
===================================================== */

const APIModule = (() => {

    const BASE_URL = "https://jsonplaceholder.typicode.com";

    // AbortController activo para poder cancelar peticiones en curso
    let controladorActivo = null;

    /* --------------------------------------------------
       FUNCION BASE DE FETCH
       Toda peticion pasa por aqui.
       Recibe la URL y un signal de AbortController opcional.
       Devuelve una Promesa con los datos o lanza un error.
    -------------------------------------------------- */
    const peticion = async (url, signal = null) => {
        const opciones = signal ? { signal } : {};
        const respuesta = await fetch(url, opciones);

        if (!respuesta.ok) {
            throw new Error("Error HTTP " + respuesta.status + " al obtener " + url);
        }

        return respuesta.json();
    };

    /* --------------------------------------------------
       CARGAR USUARIOS
       GET /users desde jsonplaceholder
    -------------------------------------------------- */
    const cargarUsuarios = async () => {
        const clave = "usuarios";

        // Revisa cache antes de hacer la peticion
        const enCache = CacheModule.obtener(clave);
        if (enCache) {
            console.time("desde-cache-usuarios");
            console.timeEnd("desde-cache-usuarios");
            return enCache;
        }

        console.time("peticion-usuarios");
        const datos = await peticion(BASE_URL + "/users");
        console.timeEnd("peticion-usuarios");

        CacheModule.guardar(clave, datos);
        return datos;
    };

    /* --------------------------------------------------
       CARGAR PUBLICACIONES
       GET /posts desde jsonplaceholder
    -------------------------------------------------- */
    const cargarPublicaciones = async () => {
        const clave = "publicaciones";

        const enCache = CacheModule.obtener(clave);
        if (enCache) return enCache;

        console.time("peticion-publicaciones");
        const datos = await peticion(BASE_URL + "/posts");
        console.timeEnd("peticion-publicaciones");

        CacheModule.guardar(clave, datos);
        return datos;
    };

    /* --------------------------------------------------
       CARGA SIMULTANEA: usuarios + publicaciones
       Usa Promise.all para lanzar ambas peticiones al mismo
       tiempo en lugar de esperar una antes de la otra.

       Si UNA falla, Promise.all rechaza todo el bloque.
       Para errores parciales se usa Promise.allSettled.
    -------------------------------------------------- */
    const cargarDashboard = async () => {
        // Promise.allSettled: recibe el resultado de cada peticion
        // aunque alguna falle, no cancela las demas.
        const [resultUsuarios, resultPublicaciones] = await Promise.allSettled([
            cargarUsuarios(),
            cargarPublicaciones()
        ]);

        return {
            usuarios: resultUsuarios.status === "fulfilled"
                ? resultUsuarios.value
                : [],
            publicaciones: resultPublicaciones.status === "fulfilled"
                ? resultPublicaciones.value
                : [],
            errores: {
                usuarios:      resultUsuarios.status === "rejected" ? resultUsuarios.reason.message : null,
                publicaciones: resultPublicaciones.status === "rejected" ? resultPublicaciones.reason.message : null
            }
        };
    };

    /* --------------------------------------------------
       BUSQUEDA CON CANCELACION (AbortController)
       Cada vez que el usuario escribe, cancela la peticion
       anterior antes de lanzar la nueva.
    -------------------------------------------------- */
    const buscarConCancelacion = async (termino) => {
        // Cancela la peticion anterior si sigue activa
        if (controladorActivo) {
            controladorActivo.abort();
        }

        controladorActivo = new AbortController();

        try {
            // Simula busqueda filtrando publicaciones por titulo
            const datos = await peticion(
                BASE_URL + "/posts",
                controladorActivo.signal
            );

            const terminoLower = termino.toLowerCase();
            return datos.filter(p =>
                p.title.toLowerCase().includes(terminoLower)
            );

        } catch (error) {
            // AbortError no es un error real, es la cancelacion esperada
            if (error.name === "AbortError") {
                return null; // indica que fue cancelada, no es fallo
            }
            throw error;
        }
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        cargarUsuarios,
        cargarPublicaciones,
        cargarDashboard,
        buscarConCancelacion
    };

})();
