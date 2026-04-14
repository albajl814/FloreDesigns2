/* =====================================================
   MODULO DE INTERFAZ - ui.data.js
   Responsable de: manipular el DOM dinamicamente,
   renderizar la lista, manejar el formulario de edicion
   y mostrar mensajes al usuario.
   Practica 1 - Manipulacion avanzada del DOM
===================================================== */

const UIModule = (() => {

    /* --------------------------------------------------
       REFERENCIAS AL DOM
       Se obtienen una sola vez al iniciar el modulo.
    -------------------------------------------------- */
    const lista    = document.querySelector("#listaDisenos");
    const mensaje  = document.querySelector("#mensaje");
    const formPrin = document.querySelector("#formDiseno");

    /* --------------------------------------------------
       MENSAJES DINAMICOS EN PANTALLA
    -------------------------------------------------- */

    // Muestra un mensaje temporal en el elemento #mensaje.
    // tipo puede ser: "info", "exito", "error"
    // El mensaje desaparece despues de 3 segundos.
    const mostrarMensaje = (texto, tipo = "info") => {
        if (!mensaje) return;

        mensaje.textContent = texto;
        mensaje.className = "mensaje-sistema mensaje-" + tipo;

        clearTimeout(mensaje._timeout);
        mensaje._timeout = setTimeout(() => {
            mensaje.textContent = "";
            mensaje.className = "mensaje-sistema";
        }, 3000);
    };

    /* --------------------------------------------------
       RENDERIZADO DE LA LISTA
    -------------------------------------------------- */

    // Limpia y vuelve a construir la lista completa de disenos.
    // Cada item incluye botones de Editar y Eliminar.
    // Usa createElement y appendChild (no innerHTML en el loop)
    // para seguir las buenas practicas del DOM.
    const render = (disenos) => {
        if (!lista) return;

        // Limpia el contenido anterior
        lista.innerHTML = "";

        if (disenos.length === 0) {
            mostrarMensaje("No hay resultados.", "info");
            return;
        }

        // Usa DocumentFragment para minimizar reflows
        const fragmento = document.createDocumentFragment();

        disenos.forEach(d => {
            const li = document.createElement("li");
            li.classList.add("diseno-item");
            li.dataset.id = d.id;

            // Contenedor del texto
            const texto = document.createElement("span");
            texto.classList.add("diseno-texto");
            texto.textContent = d.nombre + " - " + d.categoria;

            // Boton Editar
            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.classList.add("btn-editar");
            btnEditar.dataset.id = d.id;
            btnEditar.dataset.nombre = d.nombre;
            btnEditar.dataset.categoria = d.categoria;

            // Boton Eliminar
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.classList.add("btn-eliminar");
            btnEliminar.dataset.id = d.id;

            li.appendChild(texto);
            li.appendChild(btnEditar);
            li.appendChild(btnEliminar);

            fragmento.appendChild(li);
        });

        lista.appendChild(fragmento);
    };

    /* --------------------------------------------------
       FORMULARIO DE EDICION INLINE
       Al hacer clic en Editar, se reemplaza el li por
       un formulario inline. Al guardar, se vuelve a la
       vista normal sin recargar la pagina.
    -------------------------------------------------- */

    // Convierte un item de la lista en un formulario de edicion inline.
    // Guarda los nodos originales para poder restaurarlos al cancelar.
    const mostrarFormularioEdicion = (id, nombreActual, categoriaActual) => {
        const li = lista.querySelector(`li[data-id="${id}"]`);
        if (!li) return;

        // Guarda los nodos hijos originales (texto, btn editar, btn eliminar)
        // cloneNode(true) hace una copia profunda para restaurar exactamente igual
        const nodosOriginales = Array.from(li.childNodes).map(n => n.cloneNode(true));

        // Limpia el li y marca que esta en modo edicion
        li.innerHTML = "";
        li.classList.add("editando");

        // Input: nombre
        const inputNombre = document.createElement("input");
        inputNombre.type = "text";
        inputNombre.value = nombreActual;
        inputNombre.classList.add("input-edicion");
        inputNombre.id = "editNombre";
        inputNombre.placeholder = "Nombre del diseno";

        // Input: categoria
        const inputCategoria = document.createElement("input");
        inputCategoria.type = "text";
        inputCategoria.value = categoriaActual;
        inputCategoria.classList.add("input-edicion");
        inputCategoria.id = "editCategoria";
        inputCategoria.placeholder = "Categoria";

        // Boton Guardar - lleva el id en dataset para que app.js lo lea
        const btnGuardar = document.createElement("button");
        btnGuardar.textContent = "Guardar";
        btnGuardar.classList.add("btn-guardar");
        btnGuardar.dataset.id = id;

        // Boton Cancelar - restaura los nodos originales sin llamar al servidor
        const btnCancelar = document.createElement("button");
        btnCancelar.textContent = "Cancelar";
        btnCancelar.classList.add("btn-cancelar");
        btnCancelar.addEventListener("click", (e) => {
            // Detiene la propagacion para que el listener de la lista no lo procese
            e.stopPropagation();
            li.innerHTML = "";
            li.classList.remove("editando");
            nodosOriginales.forEach(n => li.appendChild(n));
        });

        li.appendChild(inputNombre);
        li.appendChild(inputCategoria);
        li.appendChild(btnGuardar);
        li.appendChild(btnCancelar);

        inputNombre.focus();
        inputNombre.select();
    };

    /* --------------------------------------------------
       CATEGORIAS EN EL FILTRO
    -------------------------------------------------- */

    // Recarga las opciones del select #filtroCategoria.
    // Recibe un arreglo de strings con las categorias unicas.
    const cargarCategorias = (categorias) => {
        const filtro = document.querySelector("#filtroCategoria");
        if (!filtro) return;

        filtro.innerHTML = "";

        const opcionTodas = document.createElement("option");
        opcionTodas.value = "";
        opcionTodas.textContent = "Todas";
        filtro.appendChild(opcionTodas);

        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            filtro.appendChild(option);
        });
    };

    /* --------------------------------------------------
       VALIDACION DE FORMULARIO PRINCIPAL
    -------------------------------------------------- */

    // Valida los campos del formulario principal antes de enviar.
    // Marca visualmente los campos con error con la clase "campo-error".
    // Devuelve true si todo es valido, false si hay errores.
    const validarFormularioPrincipal = () => {
        const inputNombre    = document.querySelector("#nombre");
        const inputCategoria = document.querySelector("#categoria");
        let valido = true;

        // Limpia errores anteriores
        [inputNombre, inputCategoria].forEach(el => {
            if (el) el.classList.remove("campo-error");
        });

        if (inputNombre && !inputNombre.value.trim()) {
            inputNombre.classList.add("campo-error");
            valido = false;
        }

        if (inputCategoria && !inputCategoria.value.trim()) {
            inputCategoria.classList.add("campo-error");
            valido = false;
        }

        return valido;
    };

    /* --------------------------------------------------
       API PUBLICA DEL MODULO
    -------------------------------------------------- */
    return {
        render,
        cargarCategorias,
        mostrarMensaje,
        mostrarFormularioEdicion,
        validarFormularioPrincipal
    };

})();
