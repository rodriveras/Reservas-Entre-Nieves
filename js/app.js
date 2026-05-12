/**
 * Orquestador principal - VERSIÓN BLINDADA (Anti-Bloqueo)
 */
const APP = {
    allData: null,
    currentDate: new Date().toISOString().split('T')[0],
    isLoaded: false,

    async init() {
        console.log("🛡️ Iniciando GeoGestión en Modo Blindado...");
        UI.init();
        
        // 1. Cargamos datos de emergencia de inmediato para que NUNCA esté vacío
        this.loadFallbackData();
        
        // 2. Intentamos la conexión real en paralelo
        this.syncKPIs();
        this.syncAllData();

        // 3. Si después de 3 segundos no hay datos reales, forzamos el renderizado de emergencia
        setTimeout(() => {
            if (!this.isLoaded) {
                console.warn("⚠️ Tiempo de espera agotado. Usando modo offline forzado.");
                UI.renderCabinList();
            }
        }, 3000);
    },

    loadFallbackData() {
        this.allData = {
            cabanas: [
                { id: 1, nombre: "Cabaña Roble", precio_base: 65000 },
                { id: 2, nombre: "Cabaña Hualle", precio_base: 75000 },
                { id: 3, nombre: "Cabaña Arrayán", precio_base: 60000 },
                { id: 4, nombre: "Cabaña Lenga", precio_base: 80000 }
            ],
            reservas: []
        };
        CALENDAR.allData = this.allData;
    },

    async syncKPIs() {
        try {
            const data = await API.getStatusByDate(this.currentDate);
            if (data && data.stats) UI.updateDashboard(data.stats);
        } catch (e) { console.warn("Error KPIs:", e); }
    },

    async syncAllData() {
        try {
            const allData = await API.getAllData();
            if (allData && allData.cabanas && allData.cabanas.length > 0) {
                console.log("✅ Datos reales recibidos de Google");
                this.allData = allData;
                CALENDAR.allData = allData;
                this.isLoaded = true;
                UI.renderStats(allData);
                UI.renderCabinList();
            }
        } catch (e) { 
            console.error("Fallo conexión:", e);
            UI.updateSyncIcon('offline');
        }
    },

    async recalcKPIs() {
        UI.updateSyncIcon('loading');
        await Promise.all([this.syncKPIs(), this.syncAllData()]);
    }
};

// Asegurar arranque
document.addEventListener('DOMContentLoaded', () => APP.init());
window.onload = () => { if (!APP.allData) APP.init(); };
