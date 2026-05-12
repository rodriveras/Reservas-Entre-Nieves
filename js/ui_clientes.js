/**
 * Módulo de UI - VERSIÓN CLIENTES
 */
const UI = {
    init() {
        document.getElementById('bs-overlay').onclick = () => this.closeCabinSheet();
    },

    toggleAccordion(btn) {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        if (content.classList.contains('open')) {
            content.classList.remove('open');
            if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
        } else {
            content.classList.add('open');
            if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
        }
    },

    openCabinSheet(feature) {
        const p = feature.properties;
        // Determinar precio base
        let precioFinal = parseFloat(p.precio || p.precio_base || p["precio base"] || 0);
        if (isNaN(precioFinal)) precioFinal = 0;

        // Obtener la posición exacta desde el mapa (GeoJSON usa [Longitud, Latitud])
        let gpsUrl = 'https://maps.google.com';
        if (feature.geometry && feature.geometry.coordinates) {
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];
            gpsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        }

        // --- Mini-calendario eliminado a petición del usuario ---
        let miniCalendar = '';

        const isOcupada = p.estado === 'Rojo';

        const content = `
            <div class="cabin-detail">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <button onclick="UI.closeCabinSheet()" style="background:transparent; border:none; color:white; font-size: 20px; cursor: pointer; padding: 0;">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="status-badge" style="background:${isOcupada ? 'rgba(220, 38, 38, 0.15)' : 'rgba(22, 163, 74, 0.15)'}; color:${isOcupada ? 'var(--error)' : 'var(--success)'}; border: 1px solid ${isOcupada ? 'rgba(220, 38, 38, 0.3)' : 'rgba(22, 163, 74, 0.3)'}; margin: 0;">
                        ${isOcupada ? 'Ocupada Hoy' : '¡Disponible!'}
                    </div>
                </div>
                
                <h2 style="font-family: 'Outfit'; font-size: 28px; font-weight: 700; color: white; margin-bottom: 5px;">${p.nombre}</h2>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom: 25px;">
                    <span style="font-size: 20px; font-weight: 700; color: var(--success);">$ ${precioFinal.toLocaleString('es-CL')}</span>
                    <span style="font-size: 14px; color: #888;">/ noche</span>
                </div>
                
                <div class="outline-card" style="margin-bottom: 25px;">
                    <label style="color: #888; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; display: block;">Ver Disponibilidad</label>
                    <div class="form-grid" style="margin-bottom: 15px;">
                        <div>
                            <label style="color: #666; font-size: 10px; font-weight: 700; text-transform: uppercase;">Llegada</label>
                            <input type="date" id="client-checkin" class="outline-input" style="margin-top: 5px; color-scheme: dark;">
                        </div>
                        <div>
                            <label style="color: #666; font-size: 10px; font-weight: 700; text-transform: uppercase;">Salida</label>
                            <input type="date" id="client-checkout" class="outline-input" style="margin-top: 5px; color-scheme: dark;">
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <a href="${gpsUrl}" target="_blank" class="btn-primary" style="background: #4285F4; border: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg" style="width: 20px;" alt="Maps"> Google Maps
                    </a>
                    <a href="https://waze.com/ul?ll=${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}&navigate=yes" target="_blank" class="btn-primary" style="background: #33CCFF; border: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px;">
                        <i class="fab fa-waze" style="font-size: 20px;"></i> Waze
                    </a>
                </div>

                <div style="margin-bottom: 25px;">
                    <button onclick="UI.sendToWhatsApp('${p.nombre}')" class="btn-primary" style="background: #25D366; border: none; color: white; width: 100%; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; font-size: 14px;">
                        <i class="fab fa-whatsapp" style="font-size: 20px;"></i> Contactar por WhatsApp
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('sheet-data').innerHTML = content;

        // Poblar fechas por defecto
        const hoy = new Date().toISOString().split('T')[0];
        const manana = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0];
        const inInput = document.getElementById('client-checkin');
        const outInput = document.getElementById('client-checkout');
        if (inInput) { inInput.value = hoy; inInput.min = hoy; }
        if (outInput) { outInput.value = manana; outInput.min = manana; }

        document.getElementById('cabin-sheet').classList.add('active');
        document.getElementById('bs-overlay').classList.add('active');
    },

    sendToWhatsApp(cabinName) {
        const text = `Hola, me interesa solicitar más información sobre la *${cabinName || 'Cabaña'}*.`;
        const finalUrl = 'https://wa.me/56983008056?text=' + encodeURIComponent(text);
        window.open(finalUrl, '_blank');
    },

    closeCabinSheet() {
        document.getElementById('cabin-sheet').classList.remove('active');
        document.getElementById('bs-overlay').classList.remove('active');
    },

    showLoading(show) {
        const pill = document.getElementById('sync-status');
        if(pill) {
            pill.innerHTML = show ? 
                '<i class="fas fa-sync fa-spin"></i>' : 
                '<i class="fas fa-circle" style="color:var(--success); font-size: 8px; filter: drop-shadow(0 0 4px var(--success));"></i>';
        }
    }
};
