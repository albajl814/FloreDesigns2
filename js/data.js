/* =====================================================
   MODULO DE DATOS - data.js
   Responsable de: almacenamiento, persistencia en
   LocalStorage y todas las operaciones sobre los datos.
   Practica 1 - Arquitectura modular
===================================================== */

const DataModule = (() => {

    const STORAGE_KEY = "disenosFlore";

    /* --------------------------------------------------
       PERSISTENCIA - LocalStorage
    -------------------------------------------------- */

    // Carga los disenos guardados en LocalStorage.
    // Si no hay datos, devuelve un arreglo vacio.
    const cargarDesdeStorage = () => {
        const datos = localStorage.getItem(STORAGE_KEY);
        return datos ? JSON.parse(datos) : [];
    };

    // Guarda el arreglo actual de disenos en LocalStorage.
    const guardarEnStorage = (disenos) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(disenos));
    };

    // Estado interno del modulo
    let disenos = cargarDesdeStorage();

    /* --------------------------------------------------
       CRUD BASICO
    -------------------------------------------------- */

    // Devuelve una copia de todos los disenos.
    const obtenerTodos = () => [...disenos];

    // Busca un diseno por su ID.
    // Devuelve el objeto encontrado o undefined.
    const obtenerPorId = (id) => disenos.find(d => d.id === id);

    // Crea un nuevo diseno con los datos recibidos.
    // Valida que nombre y categoria no esten vacios.
    // Devuelve { exito: true, diseno } o { exito: false, error }
    const agregar = ({ nombre, categoria }) => {
        const nombreLimpio = nombre.trim();
        const categoriaLimpia = categoria.trim();

        if (!nombreLimpio) {
            return { exito: false, error: "El nombre no puede estar vacio." };
        }
        if (!categoriaLimpia) {
            return { exito: false, error: "La categoria no puede estar vacia." };
        }

        const nuevo = {
            id: Date.now(),
            nombre: nombreLimpio,
            categoria: categoriaLimpia,
            fechaCreacion: new Date().toISOString()
        };

        disenos.push(nuevo);
        guardarEnStorage(disenos);

        return { exito: true, diseno: nuevo };
    };

    // Edita un diseno existente buscandolo por ID.
    // Solo actualiza los campos que vengan en datosNuevos.
    // Devuelve { exito: true } o { exito: false, error }
    const editar = (id, datosNuevos) => {
        const indice = disenos.findIndex(d => d.id === id);

        if (indice === -1) {
            return { exito: false, error: "Diseno no encontrado." };
        }

        const nombreLimpio = datosNuevos.nombre ? datosNuevos.nombre.trim() : disenos[indice].nombre;
        const categoriaLimpia = datosNuevos.categoria ? datosNuevos.categoria.trim() : disenos[indice].categoria;

        if (!nombreLimpio) {
            return { exito: false, error: "El nombre no puede estar vacio." };
        }
        if (!categoriaLimpia) {
            return { exito: false, error: "La categoria no puede estar vacia." };
        }

        disenos[indice] = {
            ...disenos[indice],
            nombre: nombreLimpio,
            categoria: categoriaLimpia
        };

        guardarEnStorage(disenos);

        return { exito: true };
    };

    // Elimina un diseno por su ID.
    // Devuelve true si se elimino, false si no existia.
    const eliminar = (id) => {
        const longitud = disenos.length;
        disenos = disenos.filter(d => d.id !== id);

        if (disenos.length === longitud) {
            return false;
        }

        guardarEnStorage(disenos);
        return true;
    };

    /* --------------------------------------------------
       BUSQUEDA Y FILTROS
    -------------------------------------------------- */

    // Busca disenos cuyo nombre contenga el texto recibido.
    // La busqueda no distingue mayusculas de minusculas.
    const buscar = (texto) => {
        const textoBuscado = texto.toLowerCase().trim();
        if (!textoBuscado) return obtenerTodos();
        return disenos.filter(d =>
            d.nombre.toLowerCase().includes(textoBuscado)
        );
    };

    // Filtra disenos por categoria exacta.
    // Si se recibe cadena vacia, devuelve todos.
    const filtrar = (categoria) => {
        if (!categoria) return obtenerTodos();
        return disenos.filter(d => d.categoria === categoria);
    };

    // Ordena los disenos por nombre.
    // criterio: "asc" (A-Z) o "desc" (Z-A)
    // Si criterio es otro valor, devuelve el orden original.
    const ordenar = (criterio) => {
        const copia = [...disenos];
        if (criterio === "asc") {
            copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        } else if (criterio === "desc") {
            copia.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
        }
        return copia;
    };

    /* --------------------------------------------------
       UTILIDADES
    -------------------------------------------------- */

    // Devuelve un arreglo con todas las categorias unicas
    // presentes en los disenos actuales, sin repetir.
    const obtenerCategorias = () => {
        return [...new Set(disenos.map(d => d.categoria))].sort();
    };

    /* --------------------------------------------------
       API PUBLICA DEL MODULO
    -------------------------------------------------- */
    return {
        obtenerTodos,
        obtenerPorId,
        agregar,
        editar,
        eliminar,
        buscar,
        filtrar,
        ordenar,
        obtenerCategorias
    };

})();
