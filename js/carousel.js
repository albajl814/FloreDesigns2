/* =====================================================
   MODULO DE CARRUSEL - carousel.js
   Carrusel avanzado SIN librerias externas.
   Incluye: autoplay, controles manuales, indicadores
   dinamicos, loop infinito simulado, soporte tactil.
   Practica 2 - Animaciones avanzadas
===================================================== */

const CarouselModule = (() => {

    /* --------------------------------------------------
       INICIALIZAR UN CARRUSEL
       Recibe el selector CSS del contenedor o el elemento mismo.
       Opciones:
         intervalo: ms entre slides en autoplay (default 4000)
         autoplay:  true/false (default true)
    -------------------------------------------------- */
    const inicializar = (selectorOElemento, opciones = {}) => {

        // Acepta selector string o elemento DOM directamente
        const contenedor = typeof selectorOElemento === "string"
            ? document.querySelector(selectorOElemento)
            : selectorOElemento;

        if (!contenedor) return null;

        const pista       = contenedor.querySelector(".carrusel-pista");
        const slides      = Array.from(contenedor.querySelectorAll(".carrusel-slide"));
        const indicadores = contenedor.querySelector(".carrusel-indicadores");
        const btnAnterior = contenedor.querySelector(".carrusel-btn.anterior");
        const btnSiguiente= contenedor.querySelector(".carrusel-btn.siguiente");

        if (!pista || slides.length === 0) return null;

        const intervalo    = opciones.intervalo || 4000;
        const autoplayActivo = opciones.autoplay !== false;

        let indiceActual = 0;
        let timerAutoplay = null;

        // Variables para soporte tactil
        let inicioToque = 0;
        let enMovimiento = false;

        /* --------------------------------------------------
           PUNTOS INDICADORES
           Se generan dinamicamente segun el numero de slides.
        -------------------------------------------------- */
        if (indicadores) {
            indicadores.innerHTML = "";
            slides.forEach((_, i) => {
                const punto = document.createElement("button");
                punto.classList.add("carrusel-punto");
                punto.setAttribute("aria-label", "Ir al slide " + (i + 1));
                if (i === 0) punto.classList.add("activo");

                punto.addEventListener("click", () => irA(i));
                indicadores.appendChild(punto);
            });
        }

        /* --------------------------------------------------
           IR A UN SLIDE ESPECIFICO
        -------------------------------------------------- */
        const irA = (indice) => {
            // Loop infinito: si pasa del ultimo, vuelve al primero y viceversa
            if (indice < 0) {
                indice = slides.length - 1;
            } else if (indice >= slides.length) {
                indice = 0;
            }

            indiceActual = indice;

            // Desplaza la pista con transform + translateX (no left/top)
            pista.style.transform = "translateX(-" + (indiceActual * 100) + "%)";

            // Actualiza los indicadores
            if (indicadores) {
                const puntos = indicadores.querySelectorAll(".carrusel-punto");
                puntos.forEach((p, i) => {
                    p.classList.toggle("activo", i === indiceActual);
                });
            }
        };

        /* --------------------------------------------------
           CONTROLES MANUALES
        -------------------------------------------------- */
        if (btnAnterior) {
            btnAnterior.addEventListener("click", () => {
                irA(indiceActual - 1);
                reiniciarAutoplay();
            });
        }

        if (btnSiguiente) {
            btnSiguiente.addEventListener("click", () => {
                irA(indiceActual + 1);
                reiniciarAutoplay();
            });
        }

        /* --------------------------------------------------
           AUTOPLAY
        -------------------------------------------------- */
        const iniciarAutoplay = () => {
            if (!autoplayActivo) return;
            timerAutoplay = setInterval(() => {
                irA(indiceActual + 1);
            }, intervalo);
        };

        const detenerAutoplay = () => {
            clearInterval(timerAutoplay);
        };

        const reiniciarAutoplay = () => {
            detenerAutoplay();
            iniciarAutoplay();
        };

        /* --------------------------------------------------
           SOPORTE TACTIL (touch events)
           Detecta deslizamiento izquierda/derecha en movil.
        -------------------------------------------------- */
        contenedor.addEventListener("touchstart", (e) => {
            inicioToque  = e.touches[0].clientX;
            enMovimiento = true;
        }, { passive: true });

        contenedor.addEventListener("touchend", (e) => {
            if (!enMovimiento) return;
            enMovimiento = false;

            const finToque   = e.changedTouches[0].clientX;
            const diferencia = inicioToque - finToque;

            // Se necesita un swipe de al menos 50px para cambiar
            if (Math.abs(diferencia) > 50) {
                if (diferencia > 0) {
                    irA(indiceActual + 1);
                } else {
                    irA(indiceActual - 1);
                }
                reiniciarAutoplay();
            }
        }, { passive: true });

        /* --------------------------------------------------
           PAUSA AL PASAR EL CURSOR
        -------------------------------------------------- */
        contenedor.addEventListener("mouseenter", detenerAutoplay);
        contenedor.addEventListener("mouseleave", iniciarAutoplay);

        /* --------------------------------------------------
           INICIA EL CARRUSEL
        -------------------------------------------------- */
        irA(0);
        iniciarAutoplay();

        // Devuelve metodos publicos para control externo si se necesitan
        return { irA, detenerAutoplay, iniciarAutoplay };
    };

    /* --------------------------------------------------
       INICIALIZAR TODOS LOS CARRUSELES EN LA PAGINA
       Busca todos los elementos con la clase .carrusel-contenedor
       y los inicializa automaticamente.
    -------------------------------------------------- */
    const inicializarTodos = (opciones = {}) => {
        const contenedores = document.querySelectorAll(".carrusel-contenedor");
        const instancias = [];

        contenedores.forEach(c => {
            const instancia = inicializar(c, opciones);
            if (instancia) instancias.push(instancia);
        });

        return instancias;
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        inicializar,
        inicializarTodos
    };

})();
