/* =====================================================
   MODULO DOM - dom.js
   Centraliza todas las operaciones de manipulacion
   del DOM: crear elementos, actualizar listas, mostrar
   errores, limpiar contenedores.
   Practica 2 - Arquitectura obligatoria
   
   Metodos expuestos:
     crearElemento(tag, clases, texto)
     vaciar(selector)
     mostrarError(selector, mensaje)
     ocultarError(selector)
     agregarClase(selector, clase)
     quitarClase(selector, clase)
     toggleVisible(elemento, visible)
===================================================== */

const DOMModule = (() => {

    /* --------------------------------------------------
       CREAR ELEMENTO GENERICO
       tag:    string con la etiqueta HTML (div, p, li, etc.)
       clases: string con clases CSS separadas por espacio
       texto:  contenido textual opcional
       Devuelve el elemento creado (NO lo inserta en el DOM)
    -------------------------------------------------- */
    const crearElemento = (tag, clases = "", texto = "") => {
        const el = document.createElement(tag);
        if (clases) {
            clases.split(" ").forEach(c => {
                if (c.trim()) el.classList.add(c.trim());
            });
        }
        if (texto) el.textContent = texto;
        return el;
    };

    /* --------------------------------------------------
       VACIAR CONTENEDOR
       Elimina todos los hijos de un elemento dado su selector.
    -------------------------------------------------- */
    const vaciar = (selector) => {
        const el = typeof selector === "string"
            ? document.querySelector(selector)
            : selector;
        if (el) el.innerHTML = "";
    };

    /* --------------------------------------------------
       MOSTRAR MENSAJE DE ERROR EN UN CAMPO
       Crea o actualiza un span.error-msg debajo del campo.
       Tambien agrega la clase .campo-invalido al input.
    -------------------------------------------------- */
    const mostrarError = (campo, mensaje) => {
        const el = typeof campo === "string"
            ? document.querySelector(campo)
            : campo;
        if (!el) return;

        el.classList.add("campo-invalido");

        // Reutiliza el span de error si ya existe
        let span = el.parentElement.querySelector(".error-msg");
        if (!span) {
            span = document.createElement("span");
            span.classList.add("error-msg");
            el.parentElement.appendChild(span);
        }
        span.textContent = mensaje;
        span.style.display = "block";
    };

    /* --------------------------------------------------
       OCULTAR MENSAJE DE ERROR EN UN CAMPO
    -------------------------------------------------- */
    const ocultarError = (campo) => {
        const el = typeof campo === "string"
            ? document.querySelector(campo)
            : campo;
        if (!el) return;

        el.classList.remove("campo-invalido");
        const span = el.parentElement.querySelector(".error-msg");
        if (span) span.style.display = "none";
    };

    /* --------------------------------------------------
       AGREGAR / QUITAR CLASE
       Utilidades para no repetir querySelector + classList
    -------------------------------------------------- */
    const agregarClase = (selector, clase) => {
        const el = typeof selector === "string"
            ? document.querySelector(selector)
            : selector;
        if (el) el.classList.add(clase);
    };

    const quitarClase = (selector, clase) => {
        const el = typeof selector === "string"
            ? document.querySelector(selector)
            : selector;
        if (el) el.classList.remove(clase);
    };

    /* --------------------------------------------------
       MOSTRAR U OCULTAR CON TRANSICION
       Usa opacity + transform en lugar de display:none
       para respetar el requisito de animacion suave.
    -------------------------------------------------- */
    const toggleVisible = (elemento, visible) => {
        const el = typeof elemento === "string"
            ? document.querySelector(elemento)
            : elemento;
        if (!el) return;

        if (visible) {
            el.style.opacity = "0";
            el.style.transform = "translateY(-8px)";
            el.style.display = "block";
            requestAnimationFrame(() => {
                el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            });
        } else {
            el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            el.style.opacity = "0";
            el.style.transform = "translateY(-8px)";
            setTimeout(() => {
                el.style.display = "none";
            }, 300);
        }
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        crearElemento,
        vaciar,
        mostrarError,
        ocultarError,
        agregarClase,
        quitarClase,
        toggleVisible
    };

})();
