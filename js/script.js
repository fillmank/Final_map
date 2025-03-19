// Initialize the map
const map = L.map('map', {
  zoom: 4.5,
  zoomDelta: 0.5,
  zoomSnap: 0.5,
  fullscreenControl: true,
  timeDimension: true,
  timeDimensionControl: true,
  timeDimensionOptions: {
    timeInterval: "2005-01-01/2020-01-01", // Yearly interval
    period: "P1Y", // Yearly period
  },
  center: [37.8, -96], // Center of the US
}).setView([37.8, -96], 4);

// Add a base layer (e.g., OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load states boundary layer
const statesLayer = L.geoJSON.ajax('data/states.geojson', {
  style: { color: '#555', weight: 1, fillOpacity: 0 } // Adjusted weight to make outlines thinner
}).addTo(map);

// Initialize TimeDimension
const timeDimension = new L.TimeDimension({
  timeInterval: "2005-01-01/2020-01-01", // Simplified to years
  period: "P1Y", // Yearly interval
});

// Add TimeDimension to the map
const timeDimensionControl = new L.Control.TimeDimension({
  playerOptions: {
    transitionTime: 1000,
    loop: true,
  },
});
map.addControl(timeDimensionControl);

// Load aggregated fires layer
const agFiresLayer = L.geoJSON.ajax('data/ag_fires.geojson', {
  pointToLayer: (feature, latlng) => {
    // Find the corresponding state geometry from statesLayer
    const stateFeature = statesLayer.getLayers().find(layer => layer.feature.properties.STUSPS === feature.properties.state);
    if (stateFeature) {
      const centroid = L.geoJSON(stateFeature.feature).getBounds().getCenter();
      return L.circleMarker(centroid, { radius: 5, color: 'red', fillOpacity: 0.5 });
    }
    return null;
  }
});

// Add fires layer to TimeDimension
const agFiresTimeLayer = L.timeDimension.layer.geoJson(agFiresLayer, {
  updateTime: (feature) => new Date(feature.properties.year, 0, 1).getTime(), // Use year only
});
agFiresTimeLayer.addTo(map);