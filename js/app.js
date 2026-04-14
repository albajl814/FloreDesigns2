/* =====================================================
   CONTROLADOR PRINCIPAL - app.js
   Conecta DataModule (data.js) con UIModule (ui.data.js).
   Maneja todos los eventos del CRUD de disenos.
   Practica 1 - Arquitectura modular
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Si no existe la lista de disenos en esta pagina, no hace nada.
    const lista = document.querySelector("#listaDisenos");
    if (!lista) return;

    /* --------------------------------------------------
       REFERENCIAS A LOS CONTROLES
    -------------------------------------------------- */
    const form     = document.querySelector("#formDiseno");
    const busqueda = document.querySelector("#busqueda");
    const filtro   = document.querySelector("#filtroCategoria");
    const ordenar  = document.querySelector("#ordenar");

    /* --------------------------------------------------
       FUNCION DE ACTUALIZACION GENERAL
       Renderiza la lista y recarga las categorias del filtro.
       Se llama cada vez que cambian los datos o los controles.
    -------------------------------------------------- */
    const actualizarUI = (datos) => {
        UIModule.render(datos);
        UIModule.cargarCategorias(DataModule.obtenerCategorias());
    };

    // Carga inicial: muestra todos los disenos guardados en LocalStorage
    actualizarUI(DataModule.obtenerTodos());

    /* --------------------------------------------------
       EVENTO: AGREGAR DISENO
       Se dispara al enviar el formulario principal.
       Valida, llama a DataModule.agregar y actualiza la UI.
    -------------------------------------------------- */
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Valida visualmente antes de procesar
        if (!UIModule.validarFormularioPrincipal()) {
            UIModule.mostrarMensaje("Por favor completa todos los campos.", "error");
            return;
        }

        const nombre    = document.querySelector("#nombre").value;
        const categoria = document.querySelector("#categoria").value;

        const resultado = DataModule.agregar({ nombre, categoria });

        if (resultado.exito) {
            actualizarUI(DataModule.obtenerTodos());
            form.reset();
            UIModule.mostrarMensaje("Diseno agregado correctamente.", "exito");
        } else {
            UIModule.mostrarMensaje(resultado.error, "error");
        }
    });

    /* --------------------------------------------------
       EVENTO: EDITAR Y ELIMINAR (delegacion de eventos)
       Un solo listener en la lista maneja todos los botones
       de todos los items, sin importar cuantos haya.
    -------------------------------------------------- */
    lista.addEventListener("click", (e) => {
        const objetivo = e.target;

        // Solo procesa clics en botones, ignora clics en el texto u otros elementos
        if (objetivo.tagName !== "BUTTON") return;

        // Boton Editar: abre el formulario inline en ese item
        if (objetivo.classList.contains("btn-editar")) {
            const id           = Number(objetivo.dataset.id);
            const nombreActual = objetivo.dataset.nombre;
            const catActual    = objetivo.dataset.categoria;
            UIModule.mostrarFormularioEdicion(id, nombreActual, catActual);

        // Boton Guardar: guarda los cambios del formulario inline
        } else if (objetivo.classList.contains("btn-guardar")) {
            const id             = Number(objetivo.dataset.id);
            const inputNombre    = document.querySelector("#editNombre");
            const inputCategoria = document.querySelector("#editCategoria");

            if (!inputNombre || !inputCategoria) return;

            const resultado = DataModule.editar(id, {
                nombre:    inputNombre.value,
                categoria: inputCategoria.value
            });

            if (resultado.exito) {
                actualizarUI(DataModule.obtenerTodos());
                UIModule.mostrarMensaje("Diseno actualizado correctamente.", "exito");
            } else {
                UIModule.mostrarMensaje(resultado.error, "error");
            }

        // Boton Cancelar: no hace nada aqui, lo maneja su propio listener en ui.data.js
        } else if (objetivo.classList.contains("btn-cancelar")) {
            // El cancelar ya tiene su propio addEventListener en mostrarFormularioEdicion
            // No se necesita logica aqui

        // Boton Eliminar: confirma y elimina el registro
        } else if (objetivo.classList.contains("btn-eliminar")) {
            if (!confirm("Seguro que deseas eliminar este diseno?")) return;

            const id = Number(objetivo.dataset.id);
            const eliminado = DataModule.eliminar(id);

            if (eliminado) {
                actualizarUI(DataModule.obtenerTodos());
                UIModule.mostrarMensaje("Diseno eliminado.", "exito");
            }
        }
    });

    /* --------------------------------------------------
       EVENTO: BUSCAR
       Filtra en tiempo real conforme el usuario escribe.
    -------------------------------------------------- */
    busqueda.addEventListener("input", () => {
        const resultados = DataModule.buscar(busqueda.value);
        UIModule.render(resultados);
    });

    /* --------------------------------------------------
       EVENTO: FILTRAR POR CATEGORIA
    -------------------------------------------------- */
    filtro.addEventListener("change", () => {
        const filtrados = DataModule.filtrar(filtro.value);
        UIModule.render(filtrados);
    });

    /* --------------------------------------------------
       EVENTO: ORDENAR
    -------------------------------------------------- */
    ordenar.addEventListener("change", () => {
        const ordenados = DataModule.ordenar(ordenar.value);
        UIModule.render(ordenados);
    });

});
