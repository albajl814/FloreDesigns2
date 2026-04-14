/* =====================================================
   MODULO DE VALIDACIONES - validaciones.js
   
   Actividad 5 - Validacion FrontEnd:
     - Expresiones regulares para email, contrasena, tel
     - Confirmacion de campos (email / contrasena)
     - Mensajes de error personalizados en pantalla
     - Validacion del campo de busqueda
   
   Actividad 6 - Validacion BackEnd (simulada):
     - Datos unicos (correo ya registrado)
     - Formato de email valido
     - Coherencia (contrasena = confirmacion)
     - Respuesta con objeto { valido, mensaje }
   
   Actividad 7 - Verificacion Humana (CAPTCHA):
     - Pregunta matematica generada aleatoriamente
     - Regeneracion si falla
     - Bloqueo del formulario hasta resolver el desafio
===================================================== */

const ValidacionesModule = (() => {

    /* ==================================================
       PARTE A: EXPRESIONES REGULARES
    ================================================== */

    // Email: usuario@dominio.extension (minimo 2 letras en extension)
    const REGEX_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    // Contrasena: minimo 6 caracteres, al menos una letra y un numero
    const REGEX_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    // Telefono mexicano: (XXX) XXX-XXXX o 10 digitos seguidos
    const REGEX_TELEFONO = /^(\(\d{3}\)\s?\d{3}-\d{4}|\d{10})$/;

    // Nombre: solo letras y espacios, minimo 2 caracteres
    const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/;

    // Busqueda: minimo 2 caracteres, sin caracteres especiales peligrosos
    const REGEX_BUSQUEDA = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\-]{2,}$/;


    /* ==================================================
       PARTE B: VALIDADORES INDIVIDUALES
       Cada funcion devuelve { valido: bool, mensaje: string }
    ================================================== */

    const validarEmail = (valor) => {
        if (!valor || valor.trim() === "") {
            return { valido: false, mensaje: "El correo electrónico es obligatorio." };
        }
        if (!REGEX_EMAIL.test(valor.trim())) {
            return { valido: false, mensaje: "Ingresa un correo válido (ej: nombre@dominio.com)." };
        }
        return { valido: true, mensaje: "" };
    };

    const validarPassword = (valor) => {
        if (!valor) {
            return { valido: false, mensaje: "La contraseña es obligatoria." };
        }
        if (valor.length < 6) {
            return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
        }
        if (!REGEX_PASSWORD.test(valor)) {
            return { valido: false, mensaje: "La contraseña debe incluir al menos una letra y un número." };
        }
        return { valido: true, mensaje: "" };
    };

    const validarConfirmacionPassword = (password, confirmacion) => {
        if (!confirmacion) {
            return { valido: false, mensaje: "Debes confirmar tu contraseña." };
        }
        if (password !== confirmacion) {
            return { valido: false, mensaje: "Las contraseñas no coinciden." };
        }
        return { valido: true, mensaje: "" };
    };

    const validarNombre = (valor) => {
        if (!valor || valor.trim() === "") {
            return { valido: false, mensaje: "El nombre completo es obligatorio." };
        }
        if (!REGEX_NOMBRE.test(valor.trim())) {
            return { valido: false, mensaje: "El nombre solo puede contener letras y espacios." };
        }
        return { valido: true, mensaje: "" };
    };

    const validarTelefono = (valor) => {
        if (!valor || valor.trim() === "") {
            return { valido: false, mensaje: "El teléfono es obligatorio." };
        }
        if (!REGEX_TELEFONO.test(valor.trim())) {
            return { valido: false, mensaje: "Ingresa un teléfono válido: (449) 123-4567 o 10 dígitos." };
        }
        return { valido: true, mensaje: "" };
    };

    const validarCampoBusqueda = (valor) => {
        if (!valor || valor.trim() === "") {
            return { valido: false, mensaje: "El campo de búsqueda no puede estar vacío." };
        }
        if (valor.trim().length < 2) {
            return { valido: false, mensaje: "Escribe al menos 2 caracteres para buscar." };
        }
        if (!REGEX_BUSQUEDA.test(valor.trim())) {
            return { valido: false, mensaje: "La búsqueda contiene caracteres no permitidos." };
        }
        return { valido: true, mensaje: "" };
    };


    /* ==================================================
       PARTE C: VALIDACION COMPLETA DEL FORMULARIO
       Valida todos los campos del registro y
       muestra mensajes de error en pantalla.
       Devuelve true si todo es valido.
    ================================================== */

    const validarFormularioRegistro = () => {
        let esValido = true;

        const nombre    = document.getElementById("registerNombre");
        const email     = document.getElementById("registerEmail");
        const telefono  = document.getElementById("registerTelefono");
        const password  = document.getElementById("registerPassword");
        const confirmar = document.getElementById("registerConfirmPassword");

        if (!nombre || !email || !password || !confirmar) return false;

        // Validar nombre
        const resNombre = validarNombre(nombre.value);
        if (!resNombre.valido) {
            DOMModule.mostrarError(nombre, resNombre.mensaje);
            esValido = false;
        } else {
            DOMModule.ocultarError(nombre);
        }

        // Validar email
        const resEmail = validarEmail(email.value);
        if (!resEmail.valido) {
            DOMModule.mostrarError(email, resEmail.mensaje);
            esValido = false;
        } else {
            DOMModule.ocultarError(email);
        }

        // Validar telefono (si existe el campo)
        if (telefono) {
            const resTel = validarTelefono(telefono.value);
            if (!resTel.valido) {
                DOMModule.mostrarError(telefono, resTel.mensaje);
                esValido = false;
            } else {
                DOMModule.ocultarError(telefono);
            }
        }

        // Validar contrasena
        const resPwd = validarPassword(password.value);
        if (!resPwd.valido) {
            DOMModule.mostrarError(password, resPwd.mensaje);
            esValido = false;
        } else {
            DOMModule.ocultarError(password);
        }

        // Validar confirmacion
        const resConf = validarConfirmacionPassword(password.value, confirmar.value);
        if (!resConf.valido) {
            DOMModule.mostrarError(confirmar, resConf.mensaje);
            esValido = false;
        } else {
            DOMModule.ocultarError(confirmar);
        }

        return esValido;
    };


    /* ==================================================
       PARTE D: VALIDACION BACKEND SIMULADA (Actividad 6)
       Simula lo que haria un servidor PHP/Node.js:
         1. Verifica que el email no este ya registrado
         2. Valida formato de email
         3. Verifica coherencia contrasena == confirmacion
       
       Devuelve { valido: bool, errores: [] }
    ================================================== */

    const validacionBackend = (datos) => {
        const errores = [];

        // 1. Formato de email (simulado como lo haria un servidor)
        if (!REGEX_EMAIL.test(datos.email)) {
            errores.push("El formato del correo electrónico no es válido.");
        }

        // 2. Dato unico: verifica si el email ya existe en localStorage
        //    (Simula una consulta SELECT a la base de datos)
        const usuarios = JSON.parse(localStorage.getItem("users") || "[]");
        const emailYaExiste = usuarios.some(
            u => u.email.toLowerCase() === datos.email.toLowerCase()
        );
        if (emailYaExiste) {
            errores.push("Este correo ya está registrado en el sistema.");
        }

        // 3. Coherencia: contrasena == confirmacion
        if (datos.password !== datos.confirmacion) {
            errores.push("La contraseña y su confirmación no coinciden.");
        }

        // 4. Formato de contrasena minima
        if (!REGEX_PASSWORD.test(datos.password)) {
            errores.push("La contraseña no cumple los requisitos mínimos de seguridad.");
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    };


    /* ==================================================
       API PUBLICA
    ================================================== */
    return {
        // Expresiones regulares expuestas para uso externo
        REGEX_EMAIL,
        REGEX_PASSWORD,
        REGEX_TELEFONO,
        REGEX_NOMBRE,
        REGEX_BUSQUEDA,

        // Validadores individuales
        validarEmail,
        validarPassword,
        validarConfirmacionPassword,
        validarNombre,
        validarTelefono,
        validarCampoBusqueda,

        // Validador de formulario completo
        validarFormularioRegistro,

        // Simulacion de validacion backend
        validacionBackend
    };

})();
