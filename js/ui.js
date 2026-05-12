/**
 * Sistema de Interfaz - GeoGestión Dash
 */
const UI = {
    donaChart: null,
    barChart: null,
    canalChart: null,

    // 🎯 Función de inicialización (Faltaba y causaba error)
    init() {
        console.log("🖥️ UI Inicializada");
        // Asegurar que el overlay esté cerrado al inicio
        const overlay = document.getElementById('bs-overlay');
        if (overlay) overlay.classList.remove('active');

        // El overlay cierra solo si el reserva-modal NO está activo
        if (overlay) {
            overlay.onclick = () => {
                const resModal = document.getElementById('reserva-modal');
                if (!resModal || !resModal.classList.contains('active')) {
                    this.closeCabinSheet();
                }
            };
        }
    },

    showView(viewId) {
        console.log("📂 Navegando a:", viewId);
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.add('active');

        if (viewId === 'gestion') {
            this.renderCabinList();
        }
        if (viewId === 'stats' && APP.allData) {
            setTimeout(() => this.buildAnalytics(APP.allData), 50);
        }
    },

    renderCabinList() {
        console.log("🎨 Dibujando lista de cabañas...");
        const container = document.getElementById('cabanas-list-container');
        const calendar = document.getElementById('calendar-content');
        const title = document.getElementById('gestion-title');
        
        if (!container) {
            console.error("❌ No se encontró el contenedor 'cabanas-list-container'");
            return;
        }

        // Limpiar y preparar
        container.style.display = 'grid';
        if (calendar) calendar.style.display = 'none';
        if (title) title.innerText = "Gestión de Cabañas";

        // Si no hay datos, mostrar carga
        if (!APP.allData || !APP.allData.cabanas) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-sync fa-spin"></i> Cargando información...
            </div>`;
            return;
        }

        // Orden fijo de cabañas
        const CABIN_ORDER = ['roble', 'arrayan', 'arrayán', 'hualle', 'lenga'];
        const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sorted = [...APP.allData.cabanas].sort((a, b) => {
            const ia = CABIN_ORDER.findIndex(o => normalize(a.nombre).includes(o));
            const ib = CABIN_ORDER.findIndex(o => normalize(b.nombre).includes(o));
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        // Dibujar tarjetas de cabañas
        container.innerHTML = sorted.map(c => `
            <div class="module-card" onclick="UI.goToPanorama(${c.id})" style="padding: 20px; border-color: rgba(255,255,255,0.1); cursor:pointer;">
                <div class="module-icon" style="width:40px; height:40px; font-size:16px; margin:0 auto 15px; pointer-events:none;"><i class="fas fa-home"></i></div>
                <h3 style="margin: 0 0 5px; font-size: 18px; text-align:center; pointer-events:none; color:white;">${c.nombre}</h3>
                <p style="font-size: 12px; color: #94a3b8; text-align:center; pointer-events:none;">Administrar disponibilidad</p>
                <div style="margin-top: 15px; color: #6366f1; font-weight:700; font-size:12px; text-align:center; pointer-events:none;">ENTRAR <i class="fas fa-arrow-right"></i></div>
            </div>
        `).join('');
    },

    backToModules() {
        const container = document.getElementById('cabanas-list-container');
        if (container && container.style.display === 'none') {
            this.renderCabinList();
        } else {
            this.showView('home');
        }
    },

    async goToPanorama(id_cabana) {
        console.log("📅 Abriendo Panorama para cabaña:", id_cabana);
        const container = document.getElementById('cabanas-list-container');
        const calendar = document.getElementById('calendar-content');
        const title = document.getElementById('gestion-title');

        if (container) container.style.display = 'none';
        if (calendar) calendar.style.display = 'block';

        if (id_cabana !== undefined && typeof CALENDAR !== 'undefined') {
            CALENDAR.currentCabinId = id_cabana;
            const cabin = APP.allData.cabanas.find(c => c.id == id_cabana);
            if (title && cabin) title.innerText = `Gestión: ${cabin.nombre}`;
        }

        if (typeof APP !== 'undefined' && APP.allData) {
            CALENDAR.render(APP.allData);
        }
    },

    updateSyncIcon(status) {
        const pill = document.getElementById('sync-status');
        if (!pill) return;
        if (status === 'live') {
            pill.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Sincronizado`;
        } else if (status === 'offline') {
            pill.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> Modo Cache <span onclick="APP.recalcKPIs()" style="text-decoration:underline; cursor:pointer;">[Reintentar]</span>`;
        } else {
            pill.innerHTML = `<i class="fas fa-sync fa-spin"></i> Conectando...`;
        }
    },

    updateDashboard(stats) {
        if (!stats) return;
        const ocupacion = Math.round((stats.ocupadas / stats.total) * 100) || 0;
        const statOcup = document.getElementById('stat-ocupacion');
        if (statOcup) statOcup.innerText = `${ocupacion}%`;
        const statIngresos = document.getElementById('stat-ingresos-mes');
        if (statIngresos) statIngresos.innerText = `$ ${stats.ingresos.toLocaleString('es-CL')}`;
        const statReservas = document.getElementById('stat-reservas');
        if (statReservas) statReservas.innerText = (stats.total - stats.ocupadas) || 0;
    },

    renderStats(allData) {
        if (document.getElementById('view-stats').classList.contains('active')) {
            this.buildAnalytics(allData || APP.allData);
        }
    },

    buildAnalytics(allData) {
        if (!allData || !allData.reservas) return;
        const reservas = allData.reservas;
        const cabanas  = allData.cabanas || [];

        // ── Parser CLP robusto ──────────────────────────────────────────
        // Maneja: 200000 / "200.000" / "295.745" / "$ 100.000"
        const parseCLPAmt = v => {
            if (!v && v !== 0) return 0;
            const s = String(v).replace(/\$|\s/g, '');
            // Si tiene punto con 3 dígitos después → separador de miles en Chile
            const cleaned = s.replace(/\./g, '');
            const n = parseInt(cleaned, 10);
            return isNaN(n) ? 0 : n;
        };

        const fmtCLP = n => '$ ' + Math.round(n).toLocaleString('es-CL');

        // ── KPI 1: Ingresos proyectados ─────────────────────────────────
        const totalIngresos = reservas.reduce((s, r) => s + parseCLPAmt(r.precios_dinamicos), 0);

        // ── KPI 2: Saldo por cobrar ─────────────────────────────────────
        const totalSaldo = reservas.reduce((s, r) => {
            const precio = parseCLPAmt(r.precios_dinamicos);
            const abono  = parseCLPAmt(r.abono);
            return s + Math.max(0, precio - abono);
        }, 0);

        // ── KPI 3: Estadía promedio ─────────────────────────────────────
        const noches = reservas.map(r => {
            const d1 = new Date(r.fecha_entrada);
            const d2 = new Date(r.fecha_salida);
            return Math.round((d2 - d1) / 86400000);
        }).filter(n => n > 0);
        const promNoches = noches.length ? (noches.reduce((a, b) => a + b, 0) / noches.length).toFixed(1) : 0;

        // ── KPI 4: Total reservas ───────────────────────────────────────
        document.getElementById('kpi-ingresos').innerText  = fmtCLP(totalIngresos);
        document.getElementById('kpi-saldo').innerText     = fmtCLP(totalSaldo);
        document.getElementById('kpi-estadia').innerText   = `${promNoches} noches`;
        document.getElementById('kpi-total-res').innerText = reservas.length;

        // ── Datos por cabaña ────────────────────────────────────────────
        const CABIN_ORDER = ['roble', 'arrayan', 'arrayán', 'hualle', 'lenga'];
        const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sortedCabanas = [...cabanas].sort((a, b) => {
            const ia = CABIN_ORDER.findIndex(o => normalize(a.nombre).includes(o));
            const ib = CABIN_ORDER.findIndex(o => normalize(b.nombre).includes(o));
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        const cabNames  = sortedCabanas.map(c => c.nombre);
        const cabColors = ['#6366f1', '#10b981', '#a855f7', '#f59e0b'];
        const cabCount  = sortedCabanas.map(c => reservas.filter(r => r.id_cabana == c.id).length);
        const cabIngresos = sortedCabanas.map(c =>
            reservas.filter(r => r.id_cabana == c.id).reduce((s, r) => s + parseCLPAmt(r.precios_dinamicos), 0)
        );

        // ── Datos por mes ───────────────────────────────────────────────
        const meses = {};
        reservas.forEach(r => {
            const mes = r.fecha_entrada ? r.fecha_entrada.substring(0, 7) : null;
            if (!mes) return;
            meses[mes] = (meses[mes] || 0) + parseCLPAmt(r.precios_dinamicos);
        });
        const mesLabels  = Object.keys(meses).sort();
        const mesNombres = mesLabels.map(m => {
            const [y, mo] = m.split('-');
            return new Date(y, mo - 1).toLocaleString('es-CL', { month: 'short', year: '2-digit' });
        });
        const mesData = mesLabels.map(m => meses[m]);

        // ── Canal de captación ──────────────────────────────────────────
        let airbnb = 0, directo = 0;
        reservas.forEach(r => {
            const comentario = (r.comentarios || '').toLowerCase();
            if (comentario.includes('airbnb')) airbnb++;
            else directo++;
        });

        // ── Gráfico 1: Dona - Reservas por cabaña ──────────────────────
        const ctxDona = document.getElementById('chart-dona');
        if (ctxDona) {
            if (this.donaChart) this.donaChart.destroy();
            this.donaChart = new Chart(ctxDona, {
                type: 'doughnut',
                data: {
                    labels: cabNames,
                    datasets: [{ data: cabCount, backgroundColor: cabColors, borderWidth: 2, borderColor: '#111827' }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
                        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} reservas` } }
                    }
                }
            });
        }

        // ── Gráfico 2: Canal de captación ───────────────────────────────
        const ctxCanal = document.getElementById('chart-canal');
        if (ctxCanal) {
            if (this.canalChart) this.canalChart.destroy();
            this.canalChart = new Chart(ctxCanal, {
                type: 'doughnut',
                data: {
                    labels: ['Airbnb', 'Directo'],
                    datasets: [{ data: [airbnb, directo], backgroundColor: ['#ec4899', '#6366f1'], borderWidth: 2, borderColor: '#111827' }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
                        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} reservas` } }
                    }
                }
            });
        }

        // ── Gráfico 3: Barras - Ingresos por mes ───────────────────────
        const ctxBar = document.getElementById('chart-barras');
        if (ctxBar) {
            if (this.barChart) this.barChart.destroy();
            this.barChart = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: mesNombres,
                    datasets: [{
                        label: 'Ingresos CLP',
                        data: mesData,
                        backgroundColor: 'rgba(99,102,241,0.7)',
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8', callback: v => '$ ' + (v/1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // ── Próximas llegadas ────────────────────────────────────────────
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const proximas = reservas
            .filter(r => new Date(r.fecha_entrada) >= hoy)
            .sort((a, b) => new Date(a.fecha_entrada) - new Date(b.fecha_entrada))
            .slice(0, 5);

        const container = document.getElementById('proximas-llegadas');
        if (container) {
            if (proximas.length === 0) {
                container.innerHTML = `<p style="color:#64748b; font-size:13px;">No hay próximas reservas registradas.</p>`;
            } else {
                container.innerHTML = proximas.map(r => {
                    const cab = cabanas.find(c => c.id == r.id_cabana);
                    const cabNombre = cab ? cab.nombre : `Cabaña ${r.id_cabana}`;
                    const fecha = new Date(r.fecha_entrada).toLocaleDateString('es-CL', { day:'numeric', month:'short' });
                    const nights = Math.round((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000);
                    const precio = fmtCLP(parseCLPAmt(r.precios_dinamicos));
                    return `
                        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:10px 14px;">
                            <div>
                                <div style="font-weight:700; font-size:14px; color:white;">${r.cliente}</div>
                                <div style="font-size:11px; color:#94a3b8; margin-top:2px;"><i class="fas fa-home"></i> ${cabNombre} &nbsp;·&nbsp; <i class="fas fa-moon"></i> ${nights} noches</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:13px; font-weight:700; color:#6366f1;">${precio}</div>
                                <div style="font-size:11px; color:#f59e0b; margin-top:2px;"><i class="fas fa-calendar"></i> ${fecha}</div>
                            </div>
                        </div>`;
                }).join('');
            }
        }
    },

    recalcKPIsFromAllData() {
        this.buildAnalytics(APP.allData);
    },

    showLoading(show) {
        this.updateSyncIcon(show ? 'loading' : 'live');
    },

    closeCabinSheet() {
        const modal = document.getElementById('reserva-modal');
        const overlay = document.getElementById('bs-overlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    },

    goToHomeFromModal() {
        this.closeCabinSheet();
        this.showView('home');
    }
};
