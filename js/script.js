// Initialize the proportional symbols map
const map1 = L.map('map1').setView([37.8, -96], 4); // Center on the US

// Add a base tile layer to map1
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map1);


let wildfires;

// Load the GeoJSON data
d3.json("fires.geojson").then(data => {
    // Simplify the GeoJSON data using Turf.js
    const simplifiedData = {
        type: "FeatureCollection",
        features: data.features.map(feature => {
            // Simplify only polygon or line geometries (not points)
            if (feature.geometry.type === "Polygon" || feature.geometry.type === "LineString") {
                return turf.simplify(feature, { tolerance: 0.01, highQuality: true });
            }
            return feature;
        })
    };

    // Assign the simplified data to the wildfires variable
    wildfires = simplifiedData;

    // Initialize the map
    initMap();
});

function initMap() {
    const map = L.map('map').setView([37.8, -96], 4); // Center on the US
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add wildfire data to the map
    addWildfires(map, 2005); // Start with the year 2005
}

function addWildfires(map, year) {
    // Clear existing layers
    if (map.wildfireLayer) {
        map.removeLayer(map.wildfireLayer);
    }

    // Filter data for the selected year
    const yearData = wildfires.features.filter(feature => feature.properties.FIRE_YEAR === year);

    // Create a layer group for the wildfires
    map.wildfireLayer = L.layerGroup().addTo(map);

    yearData.forEach(feature => {
        const { LATITUDE, LONGITUDE } = feature.properties;
        const { FIRE_SIZE } = feature.properties;

        // Create a circle marker with radius proportional to fire size
        L.circleMarker([LATITUDE, LONGITUDE], {
            radius: Math.sqrt(FIRE_SIZE) * 0.01, // Adjust scaling factor as needed
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`<b>State: ${feature.properties.STATE}</b><br>
                     Size: ${FIRE_SIZE} acres<br>
                     Cause: ${feature.properties.NWCG_CAUSE_CLASSIFICATION}`)
          .addTo(map.wildfireLayer);
    });
}

const slider = document.getElementById('slider');
const yearDisplay = document.getElementById('year');

slider.addEventListener('input', () => {
    const year = slider.value;
    yearDisplay.textContent = year;
    addWildfires(map, parseInt(year));
});