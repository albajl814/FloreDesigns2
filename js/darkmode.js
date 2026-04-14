/* =====================================================
   MODULO MODO OSCURO - darkmode.js
   
   Reto adicional: Toggle de tema claro / oscuro.
   
   Funcionamiento:
     - Alterna el atributo data-tema="oscuro" en <html>
     - Persiste la preferencia en localStorage
     - Respeta prefers-color-scheme del sistema operativo
     - Actualiza el icono y texto del botón en tiempo real
     - Compatible con todas las páginas del proyecto
   
   Uso en HTML:
     <button onclick="DarkModeModule.toggle()" class="btn-dark-mode">
         <span class="icono-tema"></span>
         <span class="texto-tema">Modo oscuro</span>
     </button>
===================================================== */

const DarkModeModule = (() => {

    const CLAVE_STORAGE = "flore-tema";
    const TEMA_OSCURO   = "oscuro";
    const TEMA_CLARO    = "claro";

    /* --------------------------------------------------
       OBTENER TEMA ACTUAL
    -------------------------------------------------- */
    const obtenerTemaActual = () => {
        return document.documentElement.getAttribute("data-tema") || TEMA_CLARO;
    };

    /* --------------------------------------------------
       APLICAR TEMA
       Modifica el atributo en <html> y guarda en localStorage.
       Actualiza todos los botones toggle de la página.
    -------------------------------------------------- */
    const aplicarTema = (tema) => {
        document.documentElement.setAttribute("data-tema", tema);
        localStorage.setItem(CLAVE_STORAGE, tema);
        actualizarBotones(tema);
    };

    /* --------------------------------------------------
       ACTUALIZAR TEXTO E ICONO DEL BOTÓN
    -------------------------------------------------- */
    const actualizarBotones = (tema) => {
        const textos  = document.querySelectorAll(".texto-tema");
        const botones = document.querySelectorAll(".btn-dark-mode");

        const esOscuro = tema === TEMA_OSCURO;

        // Actualiza el texto del boton
        textos.forEach(el => {
            el.textContent = esOscuro ? "Modo claro" : "Modo oscuro";
        });

        // Actualiza el atributo data-modo para que el CSS muestre el icono correcto
        botones.forEach(el => {
            el.setAttribute("data-modo", esOscuro ? "oscuro" : "claro");
        });
    };

    /* --------------------------------------------------
       TOGGLE
       Cambia entre claro y oscuro.
    -------------------------------------------------- */
    const toggle = () => {
        const actual    = obtenerTemaActual();
        const siguiente = actual === TEMA_OSCURO ? TEMA_CLARO : TEMA_OSCURO;
        aplicarTema(siguiente);
    };

    /* --------------------------------------------------
       INICIALIZAR
       Se llama al cargar cada página.
       Orden de prioridad:
         1. Preferencia guardada por el usuario (localStorage)
         2. Preferencia del sistema operativo (prefers-color-scheme)
         3. Claro por defecto
    -------------------------------------------------- */
    const inicializar = () => {
        const guardado = localStorage.getItem(CLAVE_STORAGE);

        if (guardado) {
            aplicarTema(guardado);
        } else {
            // Detecta si el sistema operativo prefiere modo oscuro
            const prefierOscuro = window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches;
            aplicarTema(prefierOscuro ? TEMA_OSCURO : TEMA_CLARO);
        }

        // Escucha cambios del sistema en tiempo real
        window.matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (e) => {
                // Solo aplica si el usuario no ha guardado preferencia propia
                if (!localStorage.getItem(CLAVE_STORAGE)) {
                    aplicarTema(e.matches ? TEMA_OSCURO : TEMA_CLARO);
                }
            });
    };

    /* --------------------------------------------------
       API PÚBLICA
    -------------------------------------------------- */
    return {
        inicializar,
        toggle,
        aplicarTema,
        obtenerTemaActual
    };

})();

// Auto-inicializa al cargar el script para evitar flash de tema incorrecto
DarkModeModule.inicializar();
