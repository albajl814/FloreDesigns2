// Datos de los vestidos
const dressesData = {
    1: {
        category: 'novias',
        title: 'Elegancia Clásica',
        description: 'Vestido de novia en corte princesa con encaje francés importado y cola de 3 metros. Delicados detalles de pedrería Swarovski en el corpiño.',
        materials: ['Encaje francés', 'Tul de seda', 'Pedrería Swarovski', 'Satén italiano'],
        details: 'Este diseño combina la elegancia atemporal con detalles modernos. El corpiño estructurado en encaje francés está adornado con pedrería Swarovski aplicada a mano, mientras que la falda en capas de tul de seda crea un volumen romántico.',
        tiempo: '3-4 meses',
        status: 'realizado'
    },
    2: {
        category: 'quinceaneras',
        title: 'Sueño de Princesa',
        description: 'Vestido de quinceañera en tono rosa champagne con bordados a mano en hilo de seda. Falda con 7 capas de tul para máximo volumen.',
        materials: ['Tul premium', 'Bordado de seda', 'Cristales Preciosa', 'Organza'],
        details: 'Diseñado para hacer realidad el sueño de toda quinceañera. Los bordados florales hechos a mano con hilo de seda crean un efecto tridimensional único. La falda multicapa garantiza un volumen espectacular.',
        tiempo: '2-3 meses',
        status: 'realizado'
    },
    3: {
        category: 'gala',
        title: 'Noche de Estrellas',
        description: 'Vestido de gala en corte sirena con lentejuelas bordadas en degradado. Escote asimétrico y abertura lateral dramática.',
        materials: ['Lentejuelas premium', 'Crepé de seda', 'Tul bordado', 'Forro de satén'],
        details: 'Un diseño espectacular para brillar en cualquier evento de gala. Las lentejuelas están aplicadas en un patrón degradado que crea un efecto de movimiento hipnótico. El corte sirena realza la silueta.',
        tiempo: '6-8 semanas',
        status: 'realizado'
    },
    4: {
        category: 'cocktail',
        title: 'Sofisticación Urbana',
        description: 'Vestido cocktail en mikado estructurado con detalles arquitectónicos. Largo midi con bolsillos ocultos y espalda descubierta.',
        materials: ['Mikado japonés', 'Forro de seda', 'Detalles metálicos'],
        details: 'La fusión perfecta entre elegancia y practicidad. Confeccionado en mikado japonés de alta calidad con estructura interna que mantiene la forma perfecta. Los bolsillos ocultos añaden funcionalidad sin comprometer el diseño.',
        tiempo: '4-6 semanas',
        status: 'realizado'
    },
    5: {
        category: 'novias',
        title: 'Romance Moderno',
        description: 'Vestido de novia minimalista en línea A con escote en V profundo. Confeccionado en crepé italiano con botones cubiertos en toda la espalda.',
        materials: ['Crepé italiano', 'Satén duquesa', 'Botones forrados'],
        details: 'Para la novia que busca elegancia sin excesos. Las líneas limpias del crepé italiano crean una silueta sofisticada, mientras que los botones forrados a mano en la espalda añaden un toque de romanticismo clásico.',
        tiempo: '3-4 meses',
        status: 'realizado'
    },
    6: {
        category: 'gala',
        title: 'Alta Distinción',
        description: 'Vestido de gala con sobrefalda desmontable. Corsé bordado con técnica de alta costura y falda en mikado con pliegues estructurados.',
        materials: ['Mikado de seda', 'Organza bordada', 'Tul ilusión', 'Pedrería fina'],
        details: 'Dos looks en uno: elegancia clásica con la sobrefalda y un corte más moderno al retirarla. El corsé presenta bordados elaborados con técnicas de alta costura parisina. Ideal para eventos donde quieras impactar.',
        tiempo: '4-5 meses',
        status: 'realizado'
    }
};

// Función para filtrar colección
function filterCollection(category) {
    const items = document.querySelectorAll('.portfolio-item');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Actualizar botones activos
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filtrar items
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            item.style.animation = 'fadeInUp 0.5s ease forwards';
        } else {
            item.style.display = 'none';
        }
    });
}

// Función para abrir modal con detalles
function openModal(dressId) {
    const dress = dressesData[dressId];
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
            <!-- Imagen del vestido -->
            <div>
                <div style="aspect-ratio: 3/4; background: linear-gradient(135deg, ${getCategoryGradient(dress.category)}); border-radius: 4px; margin-bottom: 1.5rem;"></div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    <div style="aspect-ratio: 1; background: linear-gradient(135deg, ${getCategoryGradient(dress.category)}); border-radius: 4px; opacity: 0.7;"></div>
                    <div style="aspect-ratio: 1; background: linear-gradient(135deg, ${getCategoryGradient(dress.category)}); border-radius: 4px; opacity: 0.5;"></div>
                    <div style="aspect-ratio: 1; background: linear-gradient(135deg, ${getCategoryGradient(dress.category)}); border-radius: 4px; opacity: 0.3;"></div>
                </div>
            </div>
            
            <!-- Detalles -->
            <div>
                <p style="font-family: var(--font-accent); font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--secondary-color); margin-bottom: 0.5rem;">
                    ${getCategoryName(dress.category)}
                </p>
                <h2 style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--primary-color); margin-bottom: 1.5rem;">
                    ${dress.title}
                </h2>
                
                <p style="font-size: 1rem; line-height: 1.8; color: var(--text-medium); margin-bottom: 2rem;">
                    ${dress.description}
                </p>
                
                <div style="padding: 1.5rem; background: var(--bg-accent); border-radius: 8px; margin-bottom: 2rem;">
                    <h4 style="font-family: var(--font-accent); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary-color); margin-bottom: 1rem;">
                        Materiales Premium
                    </h4>
                    <ul style="list-style: none; padding: 0;">
                        ${dress.materials.map(material => `
                            <li style="padding: 0.5rem 0; color: var(--text-medium); border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 0.5rem;">
                                ${material}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <p style="color: var(--text-light); font-size: 0.875rem; margin-bottom: 0.5rem;">Tiempo de confección estimado</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: var(--primary-color);">${dress.tiempo}</p>
                </div>
                
                <div style="padding: 1.5rem; background: linear-gradient(135deg, var(--secondary-color), var(--accent-color)); border-radius: 8px; color: white; margin-bottom: 2rem; text-align: center;">
                    <p style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Diseno Personalizado</p>
                    <p style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 400; line-height: 1.4;">
                        Este vestido ha sido confeccionado a la medida
                    </p>
                    <p style="font-size: 0.875rem; opacity: 0.95; margin-top: 0.75rem;">
                        Solicita tu cotización personalizada
                    </p>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="requestQuote('${dress.title}')" class="btn" style="flex: 1;">
                        Solicitar Cotización
                    </button>
                    <button onclick="closeDetailModal()" class="btn btn-secondary" style="flex: 1;">
                        Cerrar
                    </button>
                </div>
                
                <p style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); font-size: 0.875rem; line-height: 1.7; color: var(--text-medium);">
                    ${dress.details}
                </p>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modal de detalles
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Función para solicitar cotización
function requestQuote(dressTitle) {
    if (!auth.isLoggedIn()) {
        closeDetailModal();
        openAuthModal('login');
        showNotification('Inicia sesión para solicitar una cotización', 'info');
        return;
    }
    
    // Aquí normalmente se abriría un formulario de cotización
    showNotification(`Solicitud de cotización para "${dressTitle}" enviada. Te contactaremos pronto.`, 'success');
    closeDetailModal();
}

// Función auxiliar para obtener gradiente según categoría
function getCategoryGradient(category) {
    const gradients = {
        'novias': 'rgba(201, 169, 97, 0.3), rgba(233, 69, 96, 0.2)',
        'quinceaneras': 'rgba(233, 69, 96, 0.3), rgba(108, 92, 231, 0.2)',
        'gala': 'rgba(108, 92, 231, 0.3), rgba(201, 169, 97, 0.2)',
        'cocktail': 'rgba(201, 169, 97, 0.3), rgba(108, 92, 231, 0.2)'
    };
    return gradients[category] || gradients.novias;
}

// Función auxiliar para obtener nombre de categoría
function getCategoryName(category) {
    const names = {
        'novias': 'Novias',
        'quinceaneras': 'Quinceañeras',
        'gala': 'Gala',
        'cocktail': 'Cocktail'
    };
    return names[category] || category;
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDetailModal();
    }
});
