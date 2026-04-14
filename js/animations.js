/* =====================================================
   MODULO DE ANIMACIONES - animations.js
   Responsable de todas las animaciones y transiciones:
   - Scroll con IntersectionObserver
   - Parallax con mousemove
   - Efecto magnetico en botones
   - Mostrar/ocultar con transicion suave
   - requestAnimationFrame para rendimiento
   Practica 2 - Motor de animaciones
===================================================== */

const AnimationsModule = (() => {

    /* --------------------------------------------------
       UTILIDADES DE RENDIMIENTO
    -------------------------------------------------- */

    // Throttle: limita cuantas veces por segundo puede ejecutarse fn.
    // Util para eventos de alta frecuencia como scroll y mousemove.
    const throttle = (fn, limite) => {
        let ultimaVez = 0;
        return (...args) => {
            const ahora = Date.now();
            if (ahora - ultimaVez >= limite) {
                ultimaVez = ahora;
                fn(...args);
            }
        };
    };

    // Debounce: espera a que el usuario pare de ejecutar el evento
    // antes de llamar fn. Util para busqueda en tiempo real.
    const debounce = (fn, retraso) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), retraso);
        };
    };

    /* --------------------------------------------------
       ANIMACIONES CON SCROLL - IntersectionObserver
       Agrega la clase "visible" cuando un elemento .oculto
       entra en el viewport del navegador.
       Animaciones escalonadas usando retraso-N.
    -------------------------------------------------- */
    const iniciarAnimacionesScroll = () => {
        const elementos = document.querySelectorAll(
            ".oculto, .oculto-izquierda, .oculto-derecha"
        );

        if (!elementos.length) return;

        const observador = new IntersectionObserver(
            (entradas) => {
                entradas.forEach(entrada => {
                    if (entrada.isIntersecting) {
                        // Usa requestAnimationFrame para no bloquear el hilo principal
                        requestAnimationFrame(() => {
                            entrada.target.classList.add("visible");
                        });
                        // Deja de observar el elemento una vez animado
                        observador.unobserve(entrada.target);
                    }
                });
            },
            {
                threshold: 0.1,  // Se activa cuando el 10% del elemento es visible
                rootMargin: "0px 0px -50px 0px" // Margen inferior para activar antes
            }
        );

        elementos.forEach(el => observador.observe(el));
    };

    /* --------------------------------------------------
       PARALLAX CON MOUSEMOVE
       Mueve elementos .parallax-capa a diferentes velocidades
       segun la posicion del mouse en la pantalla.
       Usa throttle para no ejecutarse en cada pixel.
    -------------------------------------------------- */
    const iniciarParallax = () => {
        const capas = document.querySelectorAll(".parallax-capa");
        if (!capas.length) return;

        const moverCapas = throttle((e) => {
            const anchoPantalla  = window.innerWidth;
            const altoPantalla   = window.innerHeight;

            // Calcula cuanto se movio el mouse desde el centro (valor entre -0.5 y 0.5)
            const deltaX = (e.clientX / anchoPantalla) - 0.5;
            const deltaY = (e.clientY / altoPantalla)  - 0.5;

            capas.forEach(capa => {
                // data-profundidad define cuanto se mueve (1 = poco, 5 = mucho)
                const profundidad = parseFloat(capa.dataset.profundidad) || 2;

                requestAnimationFrame(() => {
                    capa.style.transform =
                        "translate(" +
                        (deltaX * profundidad * 20) + "px, " +
                        (deltaY * profundidad * 20) + "px)";
                });
            });
        }, 16); // ~60fps

        document.addEventListener("mousemove", moverCapas);
    };

    /* --------------------------------------------------
       EFECTO MAGNETICO EN BOTONES
       Los botones .btn-magnetico se atraen levemente
       hacia el cursor cuando este esta cerca.
    -------------------------------------------------- */
    const iniciarEfectoMagnetico = () => {
        const botones = document.querySelectorAll(".btn-magnetico");
        if (!botones.length) return;

        botones.forEach(btn => {
            btn.addEventListener("mousemove", (e) => {
                const rect      = btn.getBoundingClientRect();
                const centroBtnX = rect.left + rect.width  / 2;
                const centroBtnY = rect.top  + rect.height / 2;

                // Distancia del cursor al centro del boton
                const desplazX = (e.clientX - centroBtnX) * 0.3;
                const desplazY = (e.clientY - centroBtnY) * 0.3;

                requestAnimationFrame(() => {
                    btn.style.transform =
                        "translate(" + desplazX + "px, " + desplazY + "px)";
                });
            });

            // Al salir, el boton vuelve a su lugar con la transicion del CSS
            btn.addEventListener("mouseleave", () => {
                requestAnimationFrame(() => {
                    btn.style.transform = "translate(0, 0)";
                });
            });
        });
    };

    /* --------------------------------------------------
       MOSTRAR / OCULTAR CON TRANSICION SUAVE
       No usa display:none.
       Agrega/quita la clase .contraido en paneles .panel-colapsable.
    -------------------------------------------------- */
    const togglePanel = (panel) => {
        if (!panel) return;
        panel.classList.toggle("contraido");
    };

    /* --------------------------------------------------
       NOTIFICACION DE NUEVOS DATOS
       Aparece desde arriba por 3 segundos y desaparece.
    -------------------------------------------------- */
    const mostrarNotificacionNuevos = (mensaje) => {
        const notif = document.createElement("div");
        notif.classList.add("notificacion-nueva");
        notif.textContent = mensaje;
        document.body.appendChild(notif);

        // Fuerza reflow para que la transicion funcione
        notif.getBoundingClientRect();

        requestAnimationFrame(() => {
            notif.classList.add("mostrar");
        });

        setTimeout(() => {
            notif.classList.remove("mostrar");
            setTimeout(() => notif.remove(), 400);
        }, 3000);
    };

    /* --------------------------------------------------
       INICIALIZACION GENERAL
       Llama a todos los submodulos de animacion.
    -------------------------------------------------- */
    const iniciar = () => {
        iniciarAnimacionesScroll();
        iniciarParallax();
        iniciarEfectoMagnetico();
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        iniciar,
        iniciarAnimacionesScroll,
        iniciarParallax,
        iniciarEfectoMagnetico,
        togglePanel,
        mostrarNotificacionNuevos,
        debounce,
        throttle
    };

})();
