// ========================================
// SISTEMA DE AUTENTICACIÓN (Simulado)
// ========================================


// ========================================
// SISTEMA DE GESTIÓN DE CITAS
// ========================================

class AppointmentSystem {
    constructor() {
        this.appointments = this.loadAppointments();
    }

    loadAppointments() {
        return JSON.parse(localStorage.getItem('appointments') || '[]');
    }

    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    createAppointment(data) {
        if (!auth.isLoggedIn()) {
            return { success: false, message: 'Debes iniciar sesión para agendar una cita' };
        }

        const appointment = {
            id: Date.now(),
            userId: auth.getCurrentUser().id,
            ...data,
            estado: 'Pendiente',
            fechaCreacion: new Date().toISOString()
        };

        this.appointments.push(appointment);
        this.saveAppointments();

        return { success: true, message: 'Cita agendada exitosamente', appointment };
    }

    getUserAppointments(userId) {
        return this.appointments.filter(apt => apt.userId === userId);
    }

    cancelAppointment(id) {
        const index = this.appointments.findIndex(apt => apt.id === id);
        if (index !== -1) {
            this.appointments[index].estado = 'Cancelada';
            this.saveAppointments();
            return true;
        }
        return false;
    }
}

const appointmentSystem = new AppointmentSystem();

// ========================================
// SISTEMA DE PEDIDOS (Simulado)
// ========================================

class OrderSystem {
    constructor() {
        this.orders = this.loadOrders();
    }

    loadOrders() {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }

    saveOrders() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
    }

    createOrder(data) {
        if (!auth.isLoggedIn()) {
            return { success: false, message: 'Debes iniciar sesión para crear un pedido' };
        }

        const order = {
            id: Date.now(),
            userId: auth.getCurrentUser().id,
            ...data,
            estado: 'En proceso',
            fechaPedido: new Date().toISOString()
        };

        this.orders.push(order);
        this.saveOrders();

        return { success: true, message: 'Pedido creado exitosamente', order };
    }

    getUserOrders(userId) {
        return this.orders.filter(order => order.userId === userId);
    }
}

const orderSystem = new OrderSystem();

// ========================================
// MANEJO DE MODALES
// ========================================

function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';
    
    if (tab === 'register') {
        document.getElementById('registerTab').click();
    } else {
        document.getElementById('loginTab').click();
    }
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(tab) {
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const adminForm    = document.getElementById('adminForm');
    const loginTab     = document.getElementById('loginTab');
    const registerTab  = document.getElementById('registerTab');
    const adminTab     = document.getElementById('adminTab');

    // Oculta todos los formularios
    [loginForm, registerForm, adminForm].forEach(f => {
        if (f) { f.classList.remove('active'); f.style.display = 'none'; }
    });
    [loginTab, registerTab, adminTab].forEach(t => {
        if (t) t.classList.remove('active');
    });

    if (tab === 'login') {
        if (loginForm) { loginForm.classList.add('active'); loginForm.style.display = 'block'; }
        if (loginTab)  loginTab.classList.add('active');

    } else if (tab === 'register') {
        if (registerForm) { registerForm.classList.add('active'); registerForm.style.display = 'block'; }
        if (registerTab)  registerTab.classList.add('active');

    } else if (tab === 'admin') {
        if (adminForm) { adminForm.classList.add('active'); adminForm.style.display = 'block'; }
        if (adminTab)  adminTab.classList.add('active');
    }
}

// ========================================
// MANEJO DE FORMULARIOS
// ========================================

function handleLogin(event) {
    event.preventDefault();
    // Manejado por auth.api.js
}

// Manejo del formulario de inicio de sesion como administrador
function handleLoginAdmin(event) {
    event.preventDefault();
    const usuario  = document.getElementById('adminUsuario').value;
    const password = document.getElementById('adminPassword').value;

    if (auth.loginAdmin(usuario, password)) {
        showNotification('Bienvenido, Administrador.', 'success');
        closeAuthModal();
        event.target.reset();
        // Redirige directo al panel de administracion
        window.location.href = 'admin.html';
    } else {
        showNotification('Usuario o contrasena de administrador incorrectos', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();

    /* --------------------------------------------------
       ACTIVIDAD 5: Validacion FrontEnd con regex
       ValidacionesModule valida cada campo individualmente
       y muestra mensajes de error personalizados en pantalla.
    -------------------------------------------------- */
    const formularioValido = typeof ValidacionesModule !== "undefined"
        ? ValidacionesModule.validarFormularioRegistro()
        : true; // fallback si el modulo no cargo

    if (!formularioValido) {
        showNotification("Por favor corrige los errores del formulario.", "error");
        return;
    }

    /* --------------------------------------------------
       ACTIVIDAD 7: Verificacion Humana (CAPTCHA)
       El usuario debe resolver la pregunta matematica
       antes de poder registrarse.
    -------------------------------------------------- */
    if (typeof CaptchaModule !== "undefined") {
        const captchaOk = CaptchaModule.verificar();
        if (!captchaOk) {
            showNotification("Verifica que no eres un robot respondiendo la pregunta.", "error");
            return;
        }
    }

    const password        = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const email           = document.getElementById("registerEmail").value;
    const nombre          = document.getElementById("registerNombre").value;
    const telefono        = document.getElementById("registerTelefono")?.value || "";

    /* --------------------------------------------------
       ACTIVIDAD 6: Validacion BackEnd simulada
       Verifica: email unico, formato valido, coherencia
       de contrasena. Simula la respuesta del servidor.
    -------------------------------------------------- */
    if (typeof ValidacionesModule !== "undefined") {
        const resultBackend = ValidacionesModule.validacionBackend({
            email:       email,
            password:    password,
            confirmacion: confirmPassword
        });

        if (!resultBackend.valido) {
            // Muestra el primer error del servidor en pantalla
            showNotification(resultBackend.errores[0], "error");
            return;
        }
    }

    const userData = { nombre, email, telefono, password };

    const result = auth.register(userData);

    if (result.success) {
        showNotification(result.message, "success");
        event.target.reset();
        // Resetea el CAPTCHA para la proxima vez
        if (typeof CaptchaModule !== "undefined") CaptchaModule.resetear();
        // Auto login despues del registro
        auth.login(email, password);
        closeAuthModal();
    } else {
        showNotification(result.message, "error");
    }
}

function handleAppointment(event) {
    event.preventDefault();

    if (!auth.requireAuth()) {
        return;
    }

    const appointmentData = {
        tipo: document.getElementById('tipoCita').value,
        fecha: document.getElementById('fechaCita').value,
        hora: document.getElementById('horaCita').value,
        comentarios: document.getElementById('comentariosCita').value
    };

    const result = appointmentSystem.createAppointment(appointmentData);
    
    if (result.success) {
        showNotification(result.message, 'success');
        event.target.reset();
    } else {
        showNotification(result.message, 'error');
    }
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// MEJORA DEL MENÚ (Submenú persistente)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const submenuItems = document.querySelectorAll('.submenu');
    
    submenuItems.forEach(item => {
        let timeout;
        
        item.addEventListener('mouseenter', function() {
            clearTimeout(timeout);
            this.classList.add('open');
        });
        
        item.addEventListener('mouseleave', function() {
            const submenuElement = this;
            timeout = setTimeout(() => {
                submenuElement.classList.remove('open');
            }, 300); // Delay de 300ms antes de cerrar
        });
    });

    // Click fuera del modal para cerrarlo
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAuthModal();
            }
        });
    }

    // Cerrar notificaciones con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAuthModal();
        }
    });
});

// ========================================
// UTILIDADES
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
    }).format(amount);
}

// ========================================
// DATOS DE EJEMPLO (Para demostración)
// ========================================

function initializeSampleData() {
    // Crear usuario de ejemplo si no existe
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
        const sampleUser = {
            id: 1,
            nombre: 'María García',
            email: 'demo@floredesigns.com',
            telefono: '449-123-4567',
            password: 'demo123',
            fechaRegistro: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([sampleUser]));
    }

    // Crear pedidos de ejemplo si el usuario está logueado
    if (auth.isLoggedIn()) {
        const orders = orderSystem.getUserOrders(auth.getCurrentUser().id);
        if (orders.length === 0) {
            // Agregar algunos pedidos de ejemplo
            orderSystem.createOrder({
                titulo: 'Vestido de Novia Clásico',
                descripcion: 'Vestido estilo princesa con cola larga',
                precio: 15000,
                fechaEvento: '2026-06-15'
            });

            orderSystem.createOrder({
                titulo: 'Vestido de Quinceañera',
                descripcion: 'Vestido en tono rosa pastel con detalles bordados',
                precio: 12000,
                fechaEvento: '2026-08-20'
            });
        }
    }
}

// Inicializar datos de ejemplo al cargar
// initializeSampleData(); // Descomentar si quieres datos de ejemplo