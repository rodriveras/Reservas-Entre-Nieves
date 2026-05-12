/**
 * Módulo de Inicialización y Gestión del Mapa
 */
const MAP_ENGINE = {
    instance: null,
    layerGroup: null,

    init() {
        this.instance = L.map('map', { 
            zoomControl: false,
            attributionControl: false 
        }).setView([-36.915, -71.501], 18); // Coordenadas de las cabañas exportadas

        // Capas Base exportadas desde QGIS
        const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 28, maxNativeZoom: 18
        });
        const hibrido = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 28, maxNativeZoom: 18
        });
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 28, maxNativeZoom: 19
        });

        // Añadir satélite por defecto
        satelite.addTo(this.instance);

        // Control de capas (arriba a la derecha, agrupado con zoom)
        L.control.layers({
            "Satélite ESRI": satelite,
            "Google Híbrido": hibrido,
            "OpenStreetMap": osm
        }, null, { position: 'topright' }).addTo(this.instance);

        // Control de zoom (arriba a la derecha, desplazado por CSS)
        L.control.zoom({ position: 'topright' }).addTo(this.instance);

        this.layerGroup = L.layerGroup().addTo(this.instance);
        console.log("🗺️ Motor de Mapa listo.");
    },

    renderPoints(apiFeatures) {
        console.log("📍 Sincronizando Mapa con API...");
        this.layerGroup.clearLayers();
        
        if (typeof json_Cabaas_3 === 'undefined') return;

        const bounds = L.latLngBounds();
        const features = apiFeatures || [];

        json_Cabaas_3.features.forEach(spatialFeature => {
            try {
                const spatialName = spatialFeature.properties.nombre;
                const latlng = [spatialFeature.geometry.coordinates[1], spatialFeature.geometry.coordinates[0]];

                // Buscar datos de negocio en la API
                const apiData = features.find(f => {
                    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
                    const n1 = normalize(f.properties.nombre);
                    const n2 = normalize(spatialName);
                    return n1.includes(n2) || n2.includes(n1);
                });

                const props = { ...spatialFeature.properties, ...(apiData ? apiData.properties : {}) };
                const color = (CONFIG.COLORS && props.estado) ? (CONFIG.COLORS[props.estado] || CONFIG.COLORS.Gris) : "#888888";

                // MARCADOR SVG PREMIUM
                const marker = L.marker(latlng, {
                    icon: L.divIcon({
                        className: '',
                        html: `
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: pointer;">
                                <path d="M20 38C20 38 34 26.5 34 16C34 8.26801 27.732 2 20 2C12.268 2 6 8.26801 6 16C6 26.5 20 38 20 38Z" fill="${color}" stroke="white" stroke-width="2"/>
                                <path d="M14 16L20 11L26 16V22H14V16Z" fill="white"/>
                                <rect x="18" y="18" width="4" height="4" fill="white"/>
                            </svg>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 38]
                    }),
                    zIndexOffset: 1000
                });

                // Tooltip (Nombre sobre la cabaña)
                if (props.nombre) {
                    marker.bindTooltip(props.nombre.replace("Cabaña ", ""), {
                        permanent: true,
                        direction: "top",
                        className: "cabin-tooltip",
                        offset: [0, -42]
                    });
                }

                // Evento Click para abrir ficha
                marker.on('click', () => {
                    console.log("👆 Clic en:", props.nombre);
                    UI.openCabinSheet({ properties: props, geometry: spatialFeature.geometry });
                });

                marker.addTo(this.layerGroup);
                bounds.extend(latlng);
            } catch (e) {
                console.error("Error renderizando punto:", e);
            }
        });

        if (!bounds.isEmpty()) {
            this.instance.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        }
    }
};
