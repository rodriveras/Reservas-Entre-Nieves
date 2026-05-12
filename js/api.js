/**
 * Módulo de comunicación con el Backend (Apps Script)
 */
const API = {
    async getStatusByDate(date) {
        console.log(`📡 Consultando API para fecha: ${date}`);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);

            const response = await fetch(`${CONFIG.API_URL}?date=${date}&t=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            UI.updateSyncIcon('live');
            return data;
        } catch (error) {
            console.warn("⚠️ Usando caché/emergencia para KPIs:", error);
            UI.updateSyncIcon('offline');
            return {
                stats: { total: 4, ocupadas: 0, ingresos: 0 },
                features: []
            };
        }
    },

    async getAllData() {
        console.log(`📡 Consultando todas las reservas...`);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);

            const response = await fetch(`${CONFIG.API_URL}?action=all_data&t=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            UI.updateSyncIcon('live');
            return data;
        } catch (error) {
            console.warn("⚠️ Fallo crítico de conexión. Cargando Modo Emergencia.", error);
            UI.updateSyncIcon('offline');
            
            return {
                cabanas: [
                    { id: 1, nombre: "Cabaña Roble", precio_base: 65000 },
                    { id: 2, nombre: "Cabaña Hualle", precio_base: 75000 },
                    { id: 3, nombre: "Cabaña Arrayán", precio_base: 60000 },
                    { id: 4, nombre: "Cabaña Lenga", precio_base: 80000 }
                ],
                reservas: []
            };
        }
    },

    async createReservation(data) {
        console.log("💾 Enviando reserva a Google:", data);
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'create_reserva',
                    id_cabana: data.id_cabana,
                    cliente: data.cliente,
                    fecha_entrada: data.fecha_entrada,
                    fecha_salida: data.fecha_salida,
                    // ✅ Minúsculas: el Google Script hace toLowerCase() en los headers
                    pasajeros: data.pax || '0',
                    precios_dinamicos: data.precio_total || '0',
                    abono: data.abono || '0',
                    celular: data.celular || '',
                    email: data.email || '',
                    rrss: data.rrss || '',
                    mascota: data.mascota || 'No',
                    tina: data.tina_caliente || 'No',
                    valor_tina: data.tina_valor || '0',
                    comentarios: data.notas || ''
                })
            });

            const result = await response.json();
            return result;
        } catch (error) { throw error; }
    },

    async deleteReservation(id) {
        console.log("🗑️ Eliminando reserva:", id);
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    action: 'delete_reserva', 
                    id_reserva: id
                })
            });
            return await response.json();
        } catch (error) { throw error; }
    }
};
