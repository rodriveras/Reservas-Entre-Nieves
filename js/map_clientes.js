/**
 * Motor de Mapa - VERSIÓN CLIENTES
 */
const MAP_ENGINE = {
    instance: null,
    layerGroup: null,

    init() {
        this.instance = L.map('map', { 
            zoomControl: true,
            attributionControl: false 
        }).setView([-36.915, -71.501], 18);

        this.instance.zoomControl.setPosition('topright');

        // Capas Base
        const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 28, maxNativeZoom: 18
        });
        satelite.addTo(this.instance);

        this.layerGroup = L.layerGroup().addTo(this.instance);
        console.log("🗺️ Motor Mapa Clientes listo.");
    },

    renderPoints(apiFeatures) {
        console.log("📍 RenderPoints Cliente invocado.");
        this.layerGroup.clearLayers();
        
        if (typeof json_Cabaas_3 === 'undefined') {
            console.error("❌ ERROR: json_Cabaas_3 no está cargado.");
            return;
        }

        const featuresToRender = apiFeatures || [];
        const bounds = L.latLngBounds();

        json_Cabaas_3.features.forEach(spatialFeature => {
            try {
                const props = { ...spatialFeature.properties };
                const apiData = (apiFeatures || []).find(f => {
                    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
                    return normalize(f.properties.nombre).includes(normalize(props.nombre)) || normalize(props.nombre).includes(normalize(f.properties.nombre));
                });
                if (apiData) Object.assign(props, apiData.properties);

                const latlng = [spatialFeature.geometry.coordinates[1], spatialFeature.geometry.coordinates[0]];
                const isAvailable = props.estado === 'Verde';
                const color = isAvailable ? (CONFIG.COLORS ? CONFIG.COLORS.Verde : '#22c55e') : '#888888';

                const marker = L.circleMarker(latlng, {
                    radius: 12,
                    fillColor: color,
                    color: "white",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 1
                });

                if (props.nombre) {
                    marker.bindTooltip(props.nombre.replace("Cabaña ", ""), {
                        permanent: true,
                        direction: "top",
                        className: "cabin-tooltip",
                        offset: [0, -15]
                    });
                }

                marker.on('click', () => UI.openCabinSheet({ properties: props, geometry: spatialFeature.geometry }));
                marker.addTo(this.layerGroup);
                bounds.extend(latlng);
            } catch (e) {
                console.error("Error en renderPoints Cliente:", e);
            }
        });

        if (!bounds.isEmpty()) {
            this.instance.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        }
    }
};
