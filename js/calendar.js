/**
 * Motor del Calendario - Panorama Mensual (Edición Sincronizada)
 */

// ── Formato Moneda CLP ──────────────────────────────────────────
function formatCLP(value) {
    const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num === 0) return '';
    return '$ ' + num.toLocaleString('es-CL');
}
function parseCLP(str) {
    // Elimina $, espacios y puntos de miles → número limpio
    return String(str).replace(/[^0-9]/g, '') || '0';
}
function attachCLPFormat(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('focus', function() {
        this.value = parseCLP(this.value);
    });
    el.addEventListener('blur', function() {
        if (this.value) this.value = formatCLP(this.value);
    });
}
// ────────────────────────────────────────────────────────────────

const CALENDAR = {
    allData: null,
    currentCabinId: null,
    currentMonthDate: new Date(),

    render(allData) {
        if (!allData || !allData.cabanas) return;
        this.allData = allData;
        
        if (this.currentCabinId === null || this.currentCabinId === undefined) {
            if (allData.cabanas.length > 0) this.currentCabinId = allData.cabanas[0].id;
        }

        const container = document.getElementById('calendar-content');
        if (container) {
            container.innerHTML = this.buildUI();
            
            const cabin = allData.cabanas.find(c => c.id == this.currentCabinId);
            const viewTitle = document.querySelector('#view-gestion h2');
            if (viewTitle && cabin) viewTitle.innerText = `Gestión: ${cabin.nombre}`;

            this.renderGrid();
        }
    },
    
    buildUI() {
        if (!this.allData || !this.allData.cabanas) return '<p>Cargando...</p>';
        const cabinOptions = this.allData.cabanas.map(c => 
            `<option value="${c.id}" ${c.id == this.currentCabinId ? 'selected' : ''}>${c.nombre || 'Cabaña'}</option>`
        ).join('');
        
        return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 10px; color: white;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 10px;">
                    <select id="cal-cabin-select" style="padding:2px; border:none; background:transparent; color:white; font-size:16px; font-weight:700; font-family:'Outfit'; outline:none; flex:1;" onchange="CALENDAR.changeCabin(this.value)">
                        ${cabinOptions}
                    </select>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-primary" style="padding:6px; width:32px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.1);" onclick="CALENDAR.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="btn-primary" style="padding:6px; width:32px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.1);" onclick="CALENDAR.changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                
                <h2 id="cal-month-title" style="font-size:12px; margin-bottom:10px; font-weight:600; text-transform:capitalize; color:var(--text-dim); text-align:center;"></h2>
                
                <div style="display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-weight:800; font-size:10px; margin-bottom:10px; color:var(--text-dim);">
                    <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
                </div>
                
                <div id="cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:4px;">
                </div>
            </div>
        `;
    },

    renderGrid() {
        const grid = document.getElementById('cal-grid');
        const title = document.getElementById('cal-month-title');
        if (!grid) return;

        const year = this.currentMonthDate.getFullYear();
        const month = this.currentMonthDate.getMonth();
        title.innerText = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.currentMonthDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push({ type: 'empty' });
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ type: 'day', day: i, date: dateStr });
        }

        grid.innerHTML = days.map(day => {
            if (day.type === 'empty') return '<div></div>';
            
            const res = this.getReservationAtDate(day.date);
            const statusColor = res ? '#6366f1' : 'rgba(255,255,255,0.05)';
            const borderStyle = res ? 'border: 1px solid rgba(255,255,255,0.3);' : 'border: 1px solid rgba(255,255,255,0.05);';

            return `
                <div class="cal-day-box" onclick="CALENDAR.openDetails(${day.day})" 
                     style="aspect-ratio: 1/1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:${statusColor}; ${borderStyle} border-radius:8px; cursor:pointer;">
                    <span class="cal-day-num" style="font-size:12px; font-weight:700;">${day.day}</span>
                    ${res ? '<i class="fas fa-bookmark" style="font-size:7px; color:white;"></i>' : ''}
                </div>
            `;
        }).join('');
    },

    getReservationAtDate(dateStr) {
        if (!this.allData || !this.allData.reservas) return null;
        return this.allData.reservas.find(r => {
            if (r.id_cabana != this.currentCabinId) return false;
            const start = r.fecha_entrada.split('T')[0];
            const end = r.fecha_salida.split('T')[0];
            return dateStr >= start && dateStr < end;
        });
    },

    changeMonth(delta) {
        this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + delta);
        this.renderGrid();
    },

    changeCabin(id) {
        this.currentCabinId = id;
        const cabin = this.allData.cabanas.find(c => c.id == id);
        const viewTitle = document.querySelector('#view-gestion h2');
        if (viewTitle && cabin) viewTitle.innerText = `Gestión: ${cabin.nombre}`;
        this.renderGrid();
    },

    openDetails(day) {
        const year = this.currentMonthDate.getFullYear();
        const month = this.currentMonthDate.getMonth();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const res = this.getReservationAtDate(dateStr);
        
        // 🔍 DIAGNÓSTICO: Muestra todos los campos que devuelve Google
        if (res) {
            console.log('🔍 DATOS CRUDOS DE GOOGLE:', JSON.stringify(res, null, 2));
            console.log('🔑 CLAVES DISPONIBLES:', Object.keys(res));
        }
        
        this.showReservationModal(res, dateStr);
    },

    showReservationModal(res, dateStr) {
        const modal = document.getElementById('reserva-modal');
        const title = document.getElementById('modal-res-title');
        
        if (!modal) return;

        // ── Helper: busca un campo en el objeto sin importar mayúsculas/minúsculas ──
        const getField = (obj, ...keys) => {
            if (!obj) return '';
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
                // Búsqueda case-insensitive
                const lk = key.toLowerCase();
                for (const k of Object.keys(obj)) {
                    if (k.toLowerCase() === lk && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
                }
            }
            return '';
        };

        // ── Helper: setea valor en un elemento por ID ──
        const safeSet = (id, val, type = 'value') => {
            const el = document.getElementById(id);
            if (el) el[type] = val;
        };

        // ── DIAGNÓSTICO: muestra en consola todos los campos de la reserva ──
        if (res) {
            console.log('📋 RESERVA ABIERTA - Campos de Google Sheets:');
            console.table(res);
            console.log('🔑 Claves disponibles:', Object.keys(res).join(', '));
        }

        // ── Campos ocultos ──
        safeSet('new-res-id',        res ? (getField(res, 'id_reserva', 'id') || '') : '');
        safeSet('new-res-cabana-id', this.currentCabinId);

        const cabin = this.allData.cabanas.find(c => c.id == this.currentCabinId);
        safeSet('new-res-cabana-nombre', cabin ? cabin.nombre : 'Cabaña', 'innerText');

        // ── Estancia ──
        safeSet('new-res-cliente', res ? getField(res, 'cliente', 'Cliente') : '');
        safeSet('new-res-entrada',  res ? (res.fecha_entrada || '').split('T')[0] : dateStr);
        safeSet('new-res-salida',   res ? (res.fecha_salida  || '').split('T')[0] : dateStr);
        
        // Pasajeros - busca todas las variantes posibles
        const paxVal = res ? getField(res, 'Pasajeros', 'pasajeros', 'pax', 'PAX', 'Pax') : '';
        safeSet('new-res-pax', paxVal || '1');
        
        // Precio - busca todas las variantes posibles
        const precioVal = res ? getField(res, 'precios_dinamicos', 'precio_total', 'Precio', 'precio', 'Precio_total') : '';
        safeSet('new-res-precio-total', formatCLP(precioVal));

        // ── Huésped ──
        safeSet('new-res-abono',  formatCLP(res ? getField(res, 'abono', 'Abono') : ''));
        safeSet('new-res-celular', res ? getField(res, 'Celular', 'celular', 'telefono', 'Telefono') : '');
        safeSet('new-res-rrss',   res ? getField(res, 'rrss', 'RRSS', 'Rrss', 'redes') : '');
        safeSet('new-res-email',  res ? getField(res, 'email', 'Email', 'correo') : '');

        // ── Extras: Tina ──
        const tinaVal = res ? getField(res, 'tina', 'Tina', 'tina_caliente', 'Tina_caliente') : '';
        const hasTina = tinaVal === 'Sí' || tinaVal === 'Si' || tinaVal === 'si' || 
                        tinaVal === 'sí' || tinaVal === true || tinaVal === 'TRUE' || 
                        tinaVal === '1'  || tinaVal === 'yes' || tinaVal === 'Yes';
        if (typeof setToggle === 'function') setToggle('tina', hasTina);
        console.log(`🛁 Tina: valor="${tinaVal}" → hasTina=${hasTina}`);

        // Valor Tina formateado
        const valorTinaVal = res ? getField(res, 'Valor_tina', 'valor_tina', 'ValorTina', 'tina_valor', 'precio_tina') : '';
        safeSet('new-res-tina-valor', formatCLP(valorTinaVal));
        console.log(`💲 Valor Tina: "${valorTinaVal}"`);

        // Adjuntar formateo automático al hacer foco/blur
        setTimeout(() => {
            attachCLPFormat('new-res-precio-total');
            attachCLPFormat('new-res-abono');
            attachCLPFormat('new-res-tina-valor');
        }, 50);

        // ── Extras: Mascota ──
        const mascotaVal = res ? getField(res, 'Mascota', 'mascota', 'MASCOTA', 'pet', 'Pet') : '';
        const hasMascota = mascotaVal === 'Sí' || mascotaVal === 'Si' || mascotaVal === 'si' ||
                           mascotaVal === 'sí' || mascotaVal === true || mascotaVal === 'TRUE' ||
                           mascotaVal === '1'  || mascotaVal === 'yes';
        if (typeof setToggle === 'function') setToggle('mascota', hasMascota);
        console.log(`🐾 Mascota: valor="${mascotaVal}" → hasMascota=${hasMascota}`);

        // ── Notas ──
        safeSet('new-res-notas', res ? getField(res, 'comentarios', 'notas', 'Notas', 'Comentarios', 'observaciones') : '');

        // ── Botones ──
        const btnDelete = document.getElementById('btn-delete-res');
        const btnSave   = document.getElementById('btn-save-res');
        if (title) title.innerText = res ? 'Editar Reserva' : 'Nueva Reserva';
        if (btnDelete) btnDelete.style.display = res ? 'block' : 'none';
        if (btnSave)   btnSave.style.gridColumn = res ? '2' : 'span 2';

        modal.classList.add('active');
    },

    async saveReservation() {
        const btnSave = document.getElementById('btn-save-res');
        const originalContent = btnSave.innerHTML;
        const originalBg = btnSave.style.background;

        const getVal = (id, type = 'value') => {
            const el = document.getElementById(id);
            if (!el) return type === 'checked' ? 'No' : '';
            return type === 'checked' ? (el.checked ? 'Sí' : 'No') : el.value;
        };
        // Limpia formato moneda antes de enviar
        const getNumVal = (id) => parseCLP(getVal(id));

        const existingId = getVal('new-res-id');
        const data = {
            id_cabana: getVal('new-res-cabana-id'),
            cliente: getVal('new-res-cliente'),
            fecha_entrada: getVal('new-res-entrada'),
            fecha_salida: getVal('new-res-salida'),
            pax: getVal('new-res-pax') || '1',
            precio_total: getNumVal('new-res-precio-total'),
            abono: getNumVal('new-res-abono'),
            celular: getVal('new-res-celular'),
            rrss: getVal('new-res-rrss'),
            email: getVal('new-res-email'),
            tina_caliente: getVal('new-res-tina', 'checked'),
            tina_valor: getNumVal('new-res-tina-valor'),
            mascota: getVal('new-res-mascota', 'checked'),
            notas: getVal('new-res-notas')
        };

        if (!data.cliente || !data.fecha_entrada || !data.fecha_salida) {
            alert('Completa los campos obligatorios: Nombre, Entrada y Salida');
            return;
        }

        // 🔍 DIAGNÓSTICO - Ver qué se envía a Google
        console.log('📤 DATOS A ENVIAR A GOOGLE:', {
            Pasajeros: data.pax,
            Mascota: data.mascota,
            tina: data.tina_caliente,
            Valor_tina: data.tina_valor,
            precio: data.precio_total,
            cliente: data.cliente
        });

        try {
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            // Si es edición: borrar primero, luego crear con datos nuevos
            if (existingId) {
                console.log('✏️ Modo edición: eliminando versión anterior', existingId);
                await API.deleteReservation(existingId);
            }

            console.log('💾 Creando reserva con datos:', data);
            const result = await API.createReservation(data);
            console.log('📡 Respuesta:', result);

            if (result && (result.status === 'success' || result.result === 'success')) {
                btnSave.style.background = '#10b981';
                btnSave.innerHTML = '<i class="fas fa-check"></i> ¡Guardado! ✓';

                await APP.syncAllData();

                setTimeout(() => {
                    this.renderGrid();
                    UI.closeCabinSheet();
                    btnSave.disabled = false;
                    btnSave.innerHTML = originalContent;
                    btnSave.style.background = originalBg;
                }, 1200);
            } else {
                const msg = result ? (result.message || result.error || 'Error desconocido') : 'Sin respuesta del servidor';
                alert('⚠️ Error al guardar: ' + msg);
                btnSave.disabled = false;
                btnSave.innerHTML = originalContent;
            }
        } catch (e) {
            console.error('Error en saveReservation:', e);
            alert('Error de conexión al guardar');
            btnSave.disabled = false;
            btnSave.innerHTML = originalContent;
        }
    },

    async deleteReservation() {
        const id = document.getElementById('new-res-id').value;
        console.log('🗑️ Intentando eliminar reserva con id_reserva:', id);
        if (!id) {
            alert('No se puede eliminar: esta reserva no tiene un código de identificación.');
            return;
        }
        if (!confirm('¿Eliminar esta reserva definitivamente?')) return;

        UI.showLoading(true);
        try {
            const result = await API.deleteReservation(id);
            console.log('🗑️ Respuesta eliminación:', result);
            if (result && (result.status === 'success' || result.result === 'success')) {
                await APP.syncAllData();
                UI.closeCabinSheet();
            } else {
                const msg = result ? (result.message || result.error || 'Error desconocido') : 'Sin respuesta';
                alert('⚠️ No se pudo eliminar: ' + msg);
            }
        } catch (e) { alert('Error de conexión al eliminar'); }
        UI.showLoading(false);
    }
};
