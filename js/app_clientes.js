/**
 * Orquestador principal - VERSIÓN CLIENTES
 */
const APP = {
    async init() {
        console.log("🚀 Iniciando Portal Clientes...");
        
        MAP_ENGINE.init();
        UI.init();

        const hoy = new Date().toISOString().split('T')[0];
        const manana = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0];
        
        const checkinInput = document.getElementById('client-checkin');
        const checkoutInput = document.getElementById('client-checkout');
        
        if (checkinInput && checkoutInput) {
            checkinInput.value = hoy;
            checkinInput.min = hoy;
            
            checkoutInput.value = manana;
            checkoutInput.min = manana;
        }

        await this.updateData(hoy);
    },

    async updateData(date) {
        UI.showLoading(true);
        
        try {
            if (!this.allData) {
                this.allData = await API.getAllData();
            }
            const data = await API.getStatusByDate(date);
            MAP_ENGINE.renderPoints(data.features);
            UI.showLoading(false);
        } catch (e) {
            UI.showLoading(false);
            console.error("Error cargando disponibilidad:", e);
        }
    }
};

window.onload = () => APP.init();
