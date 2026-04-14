/* =====================================================
   FloreDesigns - Módulo de autenticación
   Archivo: js/auth.api.js
===================================================== */

let _token   = sessionStorage.getItem('fd_token')   || null;
let _refresh = sessionStorage.getItem('fd_refresh') || null;
let _usuario = null;
try { const r = sessionStorage.getItem('fd_usuario'); if (r) _usuario = JSON.parse(r); } catch(_){}

function _guardar(d) {
    _token = d.token; _refresh = d.refresh_token; _usuario = d.usuario;
    sessionStorage.setItem('fd_token', _token);
    sessionStorage.setItem('fd_refresh', _refresh);
    sessionStorage.setItem('fd_usuario', JSON.stringify(_usuario));
}
function _limpiar() {
    _token = _refresh = _usuario = null;
    ['fd_token','fd_refresh','fd_usuario','fd_mfa_uid'].forEach(k => sessionStorage.removeItem(k));
}
async function _renovarToken() {
    if (!_refresh) return false;
    try {
        const res = await fetch('api/auth/refresh.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({refresh_token:_refresh}) });
        if (!res.ok) return false;
        const d = await res.json();
        if (d.token) { _guardar(d); return true; }
    } catch(_) {}
    return false;
}
async function _apiFetch(url, opts={}) {
    const h = {'Content-Type':'application/json'};
    if (_token) h['Authorization'] = 'Bearer ' + _token;
    const cfg = {...opts, headers:{...h,...(opts.headers||{})}};
    let res = await fetch(url, cfg);
    if (res.status === 401 && _refresh) {
        const ok = await _renovarToken();
        if (ok) { cfg.headers['Authorization'] = 'Bearer ' + _token; res = await fetch(url, cfg); }
        else { _limpiar(); _actualizarUI(); }
    }
    return res;
}

function _notificar(msg, tipo='exito') {
    let n = document.getElementById('fd-notif');
    if (!n) {
        n = document.createElement('div'); n.id='fd-notif';
        n.style.cssText='position:fixed;top:80px;right:24px;z-index:9999;padding:.75rem 1.4rem;border-radius:10px;font-size:.875rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,.2);transition:opacity .3s,transform .3s;opacity:0;transform:translateY(-10px);max-width:320px;';
        document.body.appendChild(n);
    }
    n.textContent = msg;
    n.style.background = tipo==='exito' ? '#1a1a2e' : '#c62828';
    n.style.color = tipo==='exito' ? '#C9A961' : '#fff';
    n.style.opacity='1'; n.style.transform='translateY(0)';
    clearTimeout(n._t);
    n._t = setTimeout(()=>{ n.style.opacity='0'; n.style.transform='translateY(-10px)'; }, 3500);
}

function _actualizarUI() {
    const ok = !!(_token && _usuario);
    const rol = _usuario?.rol || '';
    document.querySelectorAll('.auth-buttons').forEach(el => el.style.display = ok ? 'none' : '');
    document.querySelectorAll('.perfil-menu').forEach(el => el.style.display = ok ? '' : 'none');
    document.querySelectorAll('.admin-menu-item').forEach(el => el.style.display = (ok && ['admin','superadmin'].includes(rol)) ? '' : 'none');
    document.querySelectorAll('.editor-menu-item').forEach(el => el.style.display = (ok && ['admin','superadmin','editor'].includes(rol)) ? '' : 'none');
    document.querySelectorAll('.cliente-menu-item').forEach(el => el.style.display = ok ? '' : 'none');
    const nomEl = document.getElementById('menu-nombre-usuario');
    if (nomEl && ok) nomEl.textContent = _usuario.nombre || _usuario.email;
}

/* --- MODAL --- */
function openAuthModal(tab) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab(tab || 'login');
}
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}
function switchAuthTab(tab) {
    ['loginForm','registerForm','adminForm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display='none'; el.classList.remove('active'); }
    });
    ['loginTab','registerTab','adminTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const form = document.getElementById(tab+'Form');
    const tabEl = document.getElementById(tab+'Tab');
    if (form)  { form.style.display='block'; form.classList.add('active'); }
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('.fd-error').forEach(el => el.remove());
}

function _mostrarError(formId, msg) {
    const form = document.getElementById(formId);
    if (!form) return;
    let err = form.querySelector('.fd-error');
    if (!err) {
        err = document.createElement('p'); err.className='fd-error';
        err.style.cssText='color:#c62828;font-size:.85rem;margin:.75rem 0 0;padding:.6rem 1rem;background:#fff5f5;border-radius:6px;border-left:3px solid #c62828;';
        form.prepend(err);
    }
    err.textContent = msg;
}

/* --- HANDLERS para el HTML --- */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled=true; btn.textContent='Iniciando sesión...';
    try {
        const res = await fetch('api/auth/login.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || 'Credenciales incorrectas');
        if (datos.mfa_requerido) {
            sessionStorage.setItem('fd_mfa_uid', datos.usuario_id);
            closeAuthModal(); _mostrarPanelMFA(); return;
        }
        _guardar(datos); _actualizarUI(); closeAuthModal();
        _notificar('¡Bienvenida, ' + datos.usuario.nombre + '!');
        const rol = datos.usuario.rol;
        setTimeout(() => { window.location.href = ['admin','superadmin'].includes(rol) ? 'admin.html' : 'dashboard.html'; }, 800);
    } catch(err) {
        _mostrarError('loginForm', err.message);
    } finally { btn.disabled=false; btn.textContent='Iniciar sesión'; }
}

async function handleRegister(e) {
    e.preventDefault();
    const nombre   = document.getElementById('registerNombre')?.value;
    const email    = document.getElementById('registerEmail')?.value;
    const telefono = document.getElementById('registerTelefono')?.value || '';
    const password = document.getElementById('registerPassword')?.value;
    const confirm  = document.getElementById('registerConfirmPassword')?.value;
    const btn = e.target.querySelector('button[type="submit"]');
    if (password !== confirm) { _mostrarError('registerForm','Las contraseñas no coinciden.'); return; }
    btn.disabled=true; btn.textContent='Creando cuenta...';
    try {
        const regRes = await fetch('api/auth/register.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nombre,email,password,telefono}) });
        const regD = await regRes.json();
        if (!regRes.ok) throw new Error(regD.error || 'Error al registrarse');
        const loginRes = await fetch('api/auth/login.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
        const loginD = await loginRes.json();
        if (!loginRes.ok) throw new Error('Cuenta creada. Inicia sesión manualmente.');
        _guardar(loginD); _actualizarUI(); closeAuthModal();
        _notificar('¡Cuenta creada! Bienvenida, ' + loginD.usuario.nombre + ' 🌸');
        setTimeout(() => { window.location.href='dashboard.html'; }, 1000);
    } catch(err) {
        _mostrarError('registerForm', err.message);
    } finally { btn.disabled=false; btn.textContent='Crear cuenta'; }
}

async function handleLoginAdmin(e) {
    e.preventDefault();
    const email    = document.getElementById('adminUsuario')?.value;
    const password = document.getElementById('adminPassword')?.value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled=true; btn.textContent='Verificando...';
    try {
        const res = await fetch('api/auth/login.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || 'Acceso denegado');
        if (!['admin','superadmin'].includes(datos.usuario?.rol)) throw new Error('No tienes permisos de administrador.');
        _guardar(datos); _actualizarUI(); closeAuthModal();
        _notificar('Acceso concedido. Cargando panel...');
        setTimeout(() => { window.location.href='admin.html'; }, 600);
    } catch(err) {
        _mostrarError('adminForm', err.message);
    } finally { btn.disabled=false; btn.textContent='Ingresar al Panel'; }
}

/* --- MFA panel --- */
function _mostrarPanelMFA() {
    if (document.getElementById('fd-mfa-overlay')) return;
    const ov = document.createElement('div');
    ov.id='fd-mfa-overlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:3000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    ov.innerHTML=`<div style="background:var(--bg-secondary,#fff);border-radius:16px;padding:2rem;max-width:380px;width:90%;text-align:center;">
        <h3 style="font-family:var(--font-heading);font-size:1.5rem;margin-bottom:.5rem;color:var(--primary-color,#1a1a2e);">Verificación en dos pasos</h3>
        <p style="color:var(--text-medium,#666);font-size:.875rem;margin-bottom:1.5rem;">Ingresa el código de 6 dígitos enviado a tu correo.</p>
        <input id="fd-mfa-input" type="text" maxlength="6" placeholder="000000" style="width:100%;padding:.9rem;text-align:center;font-size:1.5rem;letter-spacing:.4em;border:2px solid #ccc;border-radius:8px;outline:none;margin-bottom:1rem;">
        <p id="fd-mfa-error" style="color:#c62828;font-size:.85rem;min-height:1.2em;margin-bottom:.75rem;"></p>
        <button id="fd-mfa-btn" onclick="verificarMFA()" style="width:100%;padding:.8rem;background:var(--primary-color,#1a1a2e);color:#C9A961;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:.9rem;">Verificar código</button>
        <p style="margin-top:1rem;font-size:.8rem;"><a href="#" onclick="document.getElementById('fd-mfa-overlay').remove();openAuthModal('login');return false;" style="color:var(--primary-color,#1a1a2e);">Cancelar y volver</a></p>
    </div>`;
    document.body.appendChild(ov);
    document.getElementById('fd-mfa-input').focus();
}

async function verificarMFA() {
    const uid = sessionStorage.getItem('fd_mfa_uid');
    const codigo = document.getElementById('fd-mfa-input')?.value;
    const errEl = document.getElementById('fd-mfa-error');
    const btn = document.getElementById('fd-mfa-btn');
    if (!codigo || codigo.length < 6) { errEl.textContent='Ingresa los 6 dígitos.'; return; }
    btn.disabled=true; btn.textContent='Verificando...';
    try {
        const res = await fetch('api/auth/verificar-mfa.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({usuario_id:uid,codigo}) });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.error || 'Código incorrecto');
        sessionStorage.removeItem('fd_mfa_uid');
        _guardar(datos); _actualizarUI();
        document.getElementById('fd-mfa-overlay')?.remove();
        _notificar('¡Bienvenida, ' + datos.usuario.nombre + '!');
        setTimeout(() => { window.location.href = ['admin','superadmin'].includes(datos.usuario.rol) ? 'admin.html' : 'dashboard.html'; }, 800);
    } catch(err) {
        errEl.textContent = err.message;
        btn.disabled=false; btn.textContent='Verificar código';
    }
}

/* --- LOGOUT --- */
async function logout() {
    try { if (_token) await _apiFetch('api/auth/logout.php', {method:'POST'}); } catch(_){}
    _limpiar(); _actualizarUI();
    window.location.href = 'index.html';
}

/* --- PROTEGER RUTA --- */
function requerirAuth(rolRequerido) {
    if (!(_token && _usuario)) { window.location.href='index.html'; return false; }
    if (rolRequerido) {
        const permitidos = rolRequerido==='admin' ? ['admin','superadmin'] : [rolRequerido,'superadmin'];
        if (!permitidos.includes(_usuario.rol)) { window.location.href='dashboard.html'; return false; }
    }
    return true;
}

/* --- OBJETO PÚBLICO --- */
const auth = {
    estaAutenticado: () => !!(_token && _usuario),
    obtenerUsuario:  () => _usuario,
    obtenerToken:    () => _token,
    requerirAuth, logout,
    tieneRol: (r) => _usuario && (_usuario.rol===r || _usuario.rol==='superadmin'),
    fetch: _apiFetch,
};

document.addEventListener('DOMContentLoaded', () => {
    _actualizarUI();
    const modal = document.getElementById('authModal');
    if (modal) modal.addEventListener('click', e => { if (e.target===modal) closeAuthModal(); });
});