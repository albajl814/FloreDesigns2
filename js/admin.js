/* =====================================================
   FloreDesigns - Panel de Administración
   Práctica 2 Unidad 3 — RBAC + Rutas Seguras
   
   Todo lee de la API real (PHP + MySQL).
   auth.fetch() agrega el JWT automáticamente.
   Roles: superadmin puede todo, admin gestiona citas/pedidos/clientes,
   editor solo ve citas y diseños.
===================================================== */

/* --------------------------------------------------
   INIT
-------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

    // Protección de ruta — redirige si no es admin/superadmin
    if (!auth.requerirAuth('admin')) return;

    const u = auth.obtenerUsuario();

    // Mostrar nombre y rol en sidebar
    const nombreEl = document.getElementById('admin-nombre');
    const rolEl    = document.getElementById('admin-rol');
    if (nombreEl) nombreEl.textContent = u.nombre;
    if (rolEl)    rolEl.textContent = u.rol === 'superadmin' ? 'Super Administrador' : u.rol === 'editor' ? 'Editor' : 'Administrador';

    // Mostrar enlace Usuarios solo al superadmin
    if (u.rol === 'superadmin') {
        const nav = document.getElementById('nav-usuarios');
        if (nav) nav.style.display = 'flex';
    }

    // Ocultar secciones restringidas para editor
    if (u.rol === 'editor') {
        ['pedidos','clientes','usuarios','configuracion'].forEach(s => {
            const link = document.querySelector(`[onclick*="showSection('${s}'"]`);
            if (link) link.style.display = 'none';
        });
    }

    // Cargar dashboard por defecto
    cargarDashboard();
});

/* --------------------------------------------------
   NAVEGACIÓN ENTRE SECCIONES
-------------------------------------------------- */
function showSection(nombre, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(nombre + '-section');
    if (target) target.style.display = 'block';

    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    if (el) {
        const nav = el.closest ? el.closest('.admin-nav-item') : el;
        if (nav) nav.classList.add('active');
    }

    const acciones = {
        dashboard:     cargarDashboard,
        citas:         cargarCitas,
        pedidos:       cargarPedidos,
        clientes:      cargarClientes,
        usuarios:      cargarUsuariosAdmin,
    };
    if (acciones[nombre]) acciones[nombre]();
}

/* --------------------------------------------------
   TOAST DE NOTIFICACIÓN
-------------------------------------------------- */
function toast(msg, tipo = 'ok') {
    const colores = { ok:'#4caf50', warn:'#ff9800', err:'#dc3545', info:'#1a1a2e' };
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;bottom:2rem;right:2rem;padding:.9rem 1.5rem;border-radius:10px;font-weight:600;z-index:99999;color:white;background:${colores[tipo]||colores.info};box-shadow:0 4px 20px rgba(0,0,0,.2);transition:opacity .4s;font-size:.875rem;max-width:320px;`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 400); }, 3000);
}

/* --------------------------------------------------
   HELPER: badge de estado
-------------------------------------------------- */
function badgeEstado(estado, mapa) {
    const colores = mapa || {
        pendiente:'#ff9800', confirmada:'#2196f3', completada:'#4caf50',
        cancelada:'#dc3545', cotizacion:'#9e9e9e', diseno:'#9c27b0',
        confeccion:'#ff9800', prueba:'#2196f3', ajustes:'#ff5722',
        listo:'#4caf50', entregado:'#388e3c', activo:'#4caf50', inactivo:'#dc3545'
    };
    const color = colores[estado?.toLowerCase()] || '#999';
    return `<span style="padding:.3rem .9rem;background:${color};color:white;border-radius:20px;font-size:.75rem;font-weight:700;text-transform:capitalize;">${estado || '—'}</span>`;
}

function formatFecha(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}
function formatHora(str) {
    if (!str) return '—';
    return str.substring(0,5);
}
function timeAgo(str) {
    if (!str) return '—';
    const diff = Date.now() - new Date(str).getTime();
    const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
    if (m < 60) return `Hace ${m} min`;
    if (h < 24) return `Hace ${h}h`;
    if (d === 1) return 'Ayer';
    return `Hace ${d} días`;
}

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
async function cargarDashboard() {
    try {
        const res  = await auth.fetch('api/admin/dashboard.php');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const s = data.stats;
        const el = id => document.getElementById(id);

        if (el('citasPendientes'))  el('citasPendientes').textContent  = s.citas_pendientes;
        if (el('pedidosActivos'))   el('pedidosActivos').textContent   = s.pedidos_activos;
        if (el('nuevosClientes'))   el('nuevosClientes').textContent   = s.clientes_nuevos;
        if (el('totalUsuarios'))    el('totalUsuarios').textContent    = s.total_usuarios;

        // Actividad reciente
        const actDiv = el('actividadReciente');
        if (actDiv && data.actividad?.length) {
            actDiv.innerHTML = data.actividad.map(a => `
                <div style="padding:.85rem 0;border-bottom:1px solid #f0f0f0;display:flex;gap:.75rem;align-items:start;">
                    <div style="width:8px;height:8px;border-radius:50%;background:${a.tipo==='cita'?'#C9A961':'#6c5ce7'};margin-top:6px;flex-shrink:0;"></div>
                    <div style="flex:1;">
                        <p style="font-size:.875rem;color:var(--primary-color);margin:0 0 .2rem;">${a.texto}</p>
                        <p style="font-size:.75rem;color:var(--text-light);margin:0;">${timeAgo(a.fecha)} · ${badgeEstado(a.estado)}</p>
                    </div>
                </div>`).join('');
        } else if (actDiv) {
            actDiv.innerHTML = '<p style="color:var(--text-medium);font-size:.875rem;padding:1rem 0;">Sin actividad reciente.</p>';
        }

    } catch (err) {
        // Si la API falla (tablas no creadas aún), mostrar placeholder
        ['citasPendientes','pedidosActivos','nuevosClientes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
        const act = document.getElementById('actividadReciente');
        if (act) act.innerHTML = '<p style="color:var(--text-medium);font-size:.875rem;padding:1rem 0;">Ejecuta schema_citas_pedidos.sql para ver datos reales.</p>';
    }
}

/* ══════════════════════════════════════════════════
   CITAS
══════════════════════════════════════════════════ */
async function cargarCitas() {
    const div = document.getElementById('citasLista');
    if (!div) return;
    div.innerHTML = '<p style="padding:2rem;color:var(--text-medium);">Cargando...</p>';

    try {
        const res  = await auth.fetch('api/admin/citas.php');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const citas = data.citas || [];
        if (!citas.length) {
            div.innerHTML = '<p style="text-align:center;padding:4rem;color:var(--text-medium);">No hay citas registradas.</p>';
            return;
        }

        div.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
            <thead>
                <tr style="background:var(--bg-dark);color:white;">
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Cliente</th>
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Tipo</th>
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Fecha y hora</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Estado</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${citas.map(c => `
                <tr style="border-bottom:1px solid #f0f0f0;transition:background .15s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                    <td style="padding:.9rem 1rem;">
                        <div style="font-weight:600;color:var(--primary-color);">${c.cliente}</div>
                        <div style="font-size:.78rem;color:var(--text-medium);">${c.email}</div>
                    </td>
                    <td style="padding:.9rem 1rem;color:var(--text-medium);">${tipoCitaLabel(c.tipo)}</td>
                    <td style="padding:.9rem 1rem;">
                        <div style="font-weight:500;">${formatFecha(c.fecha)}</div>
                        <div style="font-size:.78rem;color:var(--text-medium);">${formatHora(c.hora)}</div>
                    </td>
                    <td style="padding:.9rem 1rem;text-align:center;">${badgeEstado(c.estado)}</td>
                    <td style="padding:.9rem 1rem;text-align:center;">
                        <button onclick="modalCita(${JSON.stringify(c).replace(/"/g,'&quot;')})"
                            style="padding:.45rem 1rem;background:var(--secondary-color);color:#1a1a2e;border:none;border-radius:6px;cursor:pointer;font-size:.8rem;font-weight:700;">
                            Ver / Editar
                        </button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table></div>`;

    } catch (err) {
        div.innerHTML = `<p style="padding:2rem;color:#c62828;">Error: ${err.message}</p>`;
    }
}

function tipoCitaLabel(t) {
    return {cotizacion:'Cotización',medidas:'Toma de medidas',prueba1:'1ª Prueba',prueba2:'2ª Prueba',entrega:'Entrega'}[t] || t;
}

function modalCita(c) {
    document.getElementById('adminModal')?.remove();
    const m = document.createElement('div');
    m.id = 'adminModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    m.innerHTML = `
    <div style="background:white;border-radius:14px;padding:2rem;max-width:520px;width:100%;position:relative;max-height:90vh;overflow-y:auto;">
        <button onclick="document.getElementById('adminModal').remove()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#999;">&times;</button>
        <h3 style="font-family:var(--font-heading);font-size:1.5rem;color:var(--primary-color);margin-bottom:1.5rem;">Cita #${c.id}</h3>
        <div style="padding:1rem;background:#f9f9f9;border-radius:8px;border-left:4px solid var(--secondary-color);margin-bottom:1.5rem;font-size:.875rem;line-height:1.8;">
            <strong>${c.cliente}</strong> · ${c.email}<br>
            Tipo: ${tipoCitaLabel(c.tipo)}<br>
            ${c.comentarios ? 'Nota: ' + c.comentarios : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
                <label style="display:block;font-size:.8rem;font-weight:700;color:var(--text-medium);margin-bottom:.4rem;">Fecha</label>
                <input type="date" id="ci-fecha" value="${c.fecha||''}" style="width:100%;padding:.7rem;border:1.5px solid #e0e0e0;border-radius:6px;outline:none;">
            </div>
            <div>
                <label style="display:block;font-size:.8rem;font-weight:700;color:var(--text-medium);margin-bottom:.4rem;">Hora</label>
                <input type="time" id="ci-hora" value="${c.hora?.substring(0,5)||''}" style="width:100%;padding:.7rem;border:1.5px solid #e0e0e0;border-radius:6px;outline:none;">
            </div>
        </div>
        <div style="margin-bottom:1rem;">
            <label style="display:block;font-size:.8rem;font-weight:700;color:var(--text-medium);margin-bottom:.4rem;">Estado</label>
            <select id="ci-estado" style="width:100%;padding:.7rem;border:1.5px solid #e0e0e0;border-radius:6px;outline:none;">
                ${['pendiente','confirmada','completada','cancelada'].map(e =>
                    `<option value="${e}" ${c.estado===e?'selected':''}>${e.charAt(0).toUpperCase()+e.slice(1)}</option>`
                ).join('')}
            </select>
        </div>
        <div style="margin-bottom:1.5rem;">
            <label style="display:block;font-size:.8rem;font-weight:700;color:var(--text-medium);margin-bottom:.4rem;">Notas del admin</label>
            <textarea id="ci-notas" rows="3" style="width:100%;padding:.7rem;border:1.5px solid #e0e0e0;border-radius:6px;resize:vertical;outline:none;box-sizing:border-box;">${c.notas_admin||''}</textarea>
        </div>
        <div style="display:flex;gap:1rem;justify-content:flex-end;">
            <button onclick="eliminarCita(${c.id})" style="padding:.7rem 1.4rem;background:#fff0f0;color:#c62828;border:1px solid #fcc;border-radius:6px;cursor:pointer;font-weight:600;font-size:.875rem;">Eliminar</button>
            <button onclick="guardarCita(${c.id})" style="padding:.7rem 1.4rem;background:var(--secondary-color);color:#1a1a2e;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:.875rem;">Guardar</button>
        </div>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
}

async function guardarCita(id) {
    try {
        const res = await auth.fetch('api/admin/citas.php', { method:'POST', body: JSON.stringify({
            accion:'actualizar', id,
            fecha: document.getElementById('ci-fecha').value,
            hora:  document.getElementById('ci-hora').value,
            estado: document.getElementById('ci-estado').value,
            notas_admin: document.getElementById('ci-notas').value
        })});
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        document.getElementById('adminModal')?.remove();
        toast('Cita actualizada correctamente');
        cargarCitas();
    } catch(err) { toast(err.message, 'err'); }
}

async function eliminarCita(id) {
    if (!confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;
    try {
        const res = await auth.fetch('api/admin/citas.php', { method:'POST', body: JSON.stringify({ accion:'eliminar', id }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        document.getElementById('adminModal')?.remove();
        toast('Cita eliminada', 'warn');
        cargarCitas();
        cargarDashboard();
    } catch(err) { toast(err.message, 'err'); }
}

/* ══════════════════════════════════════════════════
   PEDIDOS
══════════════════════════════════════════════════ */
async function cargarPedidos() {
    const div = document.getElementById('pedidosLista');
    if (!div) return;
    div.innerHTML = '<p style="padding:2rem;color:var(--text-medium);">Cargando...</p>';

    try {
        const res  = await auth.fetch('api/admin/pedidos.php');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const pedidos = data.pedidos || [];
        if (!pedidos.length) {
            div.innerHTML = '<p style="text-align:center;padding:4rem;color:var(--text-medium);">No hay pedidos registrados.</p>';
            return;
        }

        const estadosPedido = ['cotizacion','diseno','confeccion','prueba','ajustes','listo','entregado','cancelado'];

        div.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
            <thead>
                <tr style="background:var(--bg-dark);color:white;">
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Cliente</th>
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Vestido</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Precio</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Evento</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Estado</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Cambiar estado</th>
                </tr>
            </thead>
            <tbody>
                ${pedidos.map(p => `
                <tr style="border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                    <td style="padding:.9rem 1rem;">
                        <div style="font-weight:600;color:var(--primary-color);">${p.cliente}</div>
                        <div style="font-size:.78rem;color:var(--text-medium);">${p.email}</div>
                    </td>
                    <td style="padding:.9rem 1rem;">
                        <div style="font-weight:500;">${p.titulo}</div>
                        <div style="font-size:.78rem;color:var(--text-medium);">${p.descripcion ? p.descripcion.substring(0,50)+'...' : ''}</div>
                    </td>
                    <td style="padding:.9rem 1rem;text-align:center;font-weight:700;color:var(--secondary-color);">
                        ${p.precio ? '$'+Number(p.precio).toLocaleString('es-MX') : '—'}
                    </td>
                    <td style="padding:.9rem 1rem;text-align:center;font-size:.82rem;">${formatFecha(p.fecha_evento)}</td>
                    <td style="padding:.9rem 1rem;text-align:center;">${badgeEstado(p.estado)}</td>
                    <td style="padding:.9rem 1rem;text-align:center;">
                        <select onchange="actualizarPedido(${p.id}, this.value)"
                            style="padding:.4rem .7rem;border:1px solid #ddd;border-radius:6px;font-size:.8rem;cursor:pointer;outline:none;">
                            ${estadosPedido.map(e =>
                                `<option value="${e}" ${p.estado===e?'selected':''}>${e.charAt(0).toUpperCase()+e.slice(1)}</option>`
                            ).join('')}
                        </select>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table></div>`;

    } catch (err) {
        div.innerHTML = `<p style="padding:2rem;color:#c62828;">Error: ${err.message}</p>`;
    }
}

async function actualizarPedido(id, estado) {
    try {
        const res = await auth.fetch('api/admin/pedidos.php', { method:'POST', body: JSON.stringify({ accion:'actualizar', id, estado }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        toast('Estado actualizado: ' + estado);
        cargarDashboard();
    } catch(err) { toast(err.message, 'err'); }
}

/* ══════════════════════════════════════════════════
   CLIENTES
══════════════════════════════════════════════════ */
async function cargarClientes() {
    const div = document.getElementById('clientesLista');
    if (!div) return;
    div.innerHTML = '<p style="padding:2rem;color:var(--text-medium);">Cargando...</p>';

    try {
        const res  = await auth.fetch('api/admin/usuarios.php');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const clientes = (data.usuarios || []).filter(u => u.rol === 'cliente');
        if (!clientes.length) {
            div.innerHTML = '<p style="text-align:center;padding:4rem;color:var(--text-medium);">No hay clientes registrados.</p>';
            return;
        }

        div.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
            <thead>
                <tr style="background:var(--bg-dark);color:white;">
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Nombre</th>
                    <th style="padding:.9rem 1rem;text-align:left;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Correo</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Estado</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Registro</th>
                    <th style="padding:.9rem 1rem;text-align:center;font-family:var(--font-accent);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;">Último acceso</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(c => `
                <tr style="border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                    <td style="padding:.9rem 1rem;">
                        <div style="width:34px;height:34px;border-radius:50%;background:var(--primary-color);color:#C9A961;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;margin-right:.75rem;vertical-align:middle;">${c.nombre.charAt(0).toUpperCase()}</div>
                        <span style="font-weight:600;color:var(--primary-color);">${c.nombre}</span>
                    </td>
                    <td style="padding:.9rem 1rem;color:var(--text-medium);">${c.email}</td>
                    <td style="padding:.9rem 1rem;text-align:center;">${badgeEstado(c.activo ? 'activo' : 'inactivo')}</td>
                    <td style="padding:.9rem 1rem;text-align:center;font-size:.82rem;color:var(--text-medium);">${formatFecha(c.creado_en)}</td>
                    <td style="padding:.9rem 1rem;text-align:center;font-size:.82rem;color:var(--text-medium);">${c.ultimo_login ? timeAgo(c.ultimo_login) : 'Nunca'}</td>
                </tr>`).join('')}
            </tbody>
        </table></div>`;

    } catch (err) {
        div.innerHTML = `<p style="padding:2rem;color:#c62828;">Error: ${err.message}</p>`;
    }
}

/* ══════════════════════════════════════════════════
   USUARIOS Y ROLES (superadmin)
   — Ya implementado en la sección anterior del HTML
   — Solo añadimos el hook de carga
══════════════════════════════════════════════════ */
// cargarUsuariosAdmin() ya existe en admin.html (sección inyectada)
// Aquí solo nos aseguramos que showSection lo llame correctamente