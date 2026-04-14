/* =====================================================
   MODULO CAPTCHA - captcha.js
   
   Actividad 7 - Mecanismo de desafio-respuesta
   Implementa verificacion humana mediante:
     - Pregunta matematica aleatoria (ej: 4 + 7 = ?)
     - Regeneracion automatica al fallar
     - Bloqueo del formulario hasta resolver
     - Feedback visual inmediato
   
   Uso:
     CaptchaModule.insertar("idContenedor")
     CaptchaModule.verificar()  -> true | false
     CaptchaModule.resetear()
===================================================== */

const CaptchaModule = (() => {

    // Almacena la respuesta correcta actual
    let respuestaCorrecta = null;
    // ID del contenedor donde se inyecto el captcha
    let contenedorId = null;

    /* --------------------------------------------------
       GENERAR OPERACION ALEATORIA
       Devuelve un objeto { pregunta, respuesta }
       con operaciones sencillas: suma, resta, multiplicacion
    -------------------------------------------------- */
    const generarOperacion = () => {
        const operaciones = ["+", "-", "×"];
        const op = operaciones[Math.floor(Math.random() * operaciones.length)];
        let a, b, respuesta;

        switch (op) {
            case "+":
                a = Math.floor(Math.random() * 10) + 1;
                b = Math.floor(Math.random() * 10) + 1;
                respuesta = a + b;
                break;
            case "-":
                a = Math.floor(Math.random() * 10) + 5;
                b = Math.floor(Math.random() * a) + 1;
                respuesta = a - b;
                break;
            case "×":
                a = Math.floor(Math.random() * 5) + 2;
                b = Math.floor(Math.random() * 5) + 2;
                respuesta = a * b;
                break;
        }

        return {
            pregunta: `¿Cuánto es ${a} ${op} ${b}?`,
            respuesta: respuesta
        };
    };

    /* --------------------------------------------------
       INSERTAR CAPTCHA EN EL DOM
       Crea visualmente el desafio dentro del contenedor dado.
    -------------------------------------------------- */
    const insertar = (idContenedor) => {
        contenedorId = idContenedor;
        const contenedor = document.getElementById(idContenedor);
        if (!contenedor) return;

        const operacion = generarOperacion();
        respuestaCorrecta = operacion.respuesta;

        contenedor.innerHTML = `
            <div class="captcha-bloque" style="
                border: 1px dashed #C9A961;
                border-radius: 8px;
                padding: 1rem 1.25rem;
                background: #fdf9f2;
                margin-top: 1rem;
            ">
                <p style="
                    font-size: 0.78rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #888;
                    margin: 0 0 0.6rem;
                ">Verificación de seguridad</p>

                <label for="captchaInput" style="
                    font-weight: 600;
                    color: #1a1a2e;
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                ">${operacion.pregunta}</label>

                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <input
                        type="number"
                        id="captchaInput"
                        placeholder="Tu respuesta"
                        autocomplete="off"
                        style="
                            width: 120px;
                            padding: 0.5rem 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 1rem;
                            outline: none;
                        "
                    >
                    <button
                        type="button"
                        onclick="CaptchaModule.regenerar()"
                        title="Cambiar pregunta"
                        style="
                            background: transparent;
                            border: 1px solid #ccc;
                            border-radius: 6px;
                            padding: 0.5rem 0.75rem;
                            cursor: pointer;
                            font-size: 1rem;
                            color: #555;
                        "
                    >Nueva</button>
                </div>

                <span id="captchaMsg" style="
                    display: none;
                    font-size: 0.8rem;
                    margin-top: 0.4rem;
                    font-weight: 500;
                "></span>
            </div>
        `;
    };

    /* --------------------------------------------------
       VERIFICAR LA RESPUESTA DEL USUARIO
       Devuelve true si es correcta, false si no.
       Muestra mensaje visual de exito o error.
    -------------------------------------------------- */
    const verificar = () => {
        const input = document.getElementById("captchaInput");
        const msg   = document.getElementById("captchaMsg");

        if (!input || !msg) return false;

        const respuestaUsuario = parseInt(input.value, 10);

        if (isNaN(respuestaUsuario)) {
            msg.textContent = "Por favor responde la pregunta de verificación.";
            msg.style.color = "#c62828";
            msg.style.display = "block";
            return false;
        }

        if (respuestaUsuario === respuestaCorrecta) {
            msg.textContent = "Verificacion correcta";
            msg.style.color = "#2e7d32";
            msg.style.display = "block";
            input.disabled = true;
            return true;
        } else {
            msg.textContent = "Respuesta incorrecta. Intenta de nuevo.";
            msg.style.color = "#c62828";
            msg.style.display = "block";
            input.value = "";
            // Regenera la pregunta automaticamente tras 1.5s
            setTimeout(() => {
                if (contenedorId) regenerar();
            }, 1500);
            return false;
        }
    };

    /* --------------------------------------------------
       REGENERAR: genera una nueva pregunta
    -------------------------------------------------- */
    const regenerar = () => {
        if (contenedorId) insertar(contenedorId);
    };

    /* --------------------------------------------------
       RESETEAR: vuelve al estado inicial (sin responder)
    -------------------------------------------------- */
    const resetear = () => {
        if (contenedorId) insertar(contenedorId);
    };

    /* --------------------------------------------------
       API PUBLICA
    -------------------------------------------------- */
    return {
        insertar,
        verificar,
        regenerar,
        resetear
    };

})();
