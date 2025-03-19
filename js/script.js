// Initialize the map
const map = L.map('map', {
  zoom: 4.5,
  center: [37.8, -96], // Center of the US
  timeDimension: true,
  timeDimensionOptions: {
    timeInterval: "2005-01-01/2020-01-01", // Yearly interval
    period: "P1Y", // Yearly period
  },
  timeDimensionControl: true,
});

// Add a base layer (e.g., OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load states boundary layer
const statesLayer = L.geoJSON.ajax('data/states.geojson', {
  style: { color: '#555', weight: 1, fillOpacity: 0 } // Adjusted weight to make outlines thinner
}).addTo(map);

// Load aggregated fires layer
const agFiresLayer = L.geoJSON.ajax('data/ag_fires.geojson', {
  pointToLayer: (feature) => {
    // Find the corresponding state geometry from statesLayer
    const stateFeature = statesLayer.getLayers().find(layer => layer.feature.properties.STUSPS === feature.properties.state);
    if (stateFeature) {
      // Calculate the centroid of the state geometry
      const centroid = L.geoJSON(stateFeature.feature).getBounds().getCenter();
      // Create a circle marker at the centroid
      return L.circleMarker(centroid, {
        radius: 5, // Adjust the radius based on fire_count if needed
        color: 'red',
        fillOpacity: 0.5
      });
    }
    return null; // Skip if no matching state is found
  }
});

// Load air quality layer
const aqLayer = L.geoJSON.ajax('data/aq_yearly.geojson', {
  style: (feature) => {
    // Find the corresponding state geometry from statesLayer
    const stateFeature = statesLayer.getLayers().find(layer => layer.feature.properties.STUSPS === feature.properties.STUSPS);
    if (stateFeature) {
      return {
        fillColor: getColor(feature.properties.avg_value), // Define getColor function based on air quality value
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
      };
    }
    return {};
  }
});

// Function to get color based on air quality value
function getColor(aqValue) {
  return aqValue > 50 ? '#800026' :
         aqValue > 40 ? '#BD0026' :
         aqValue > 30 ? '#E31A1C' :
         aqValue > 20 ? '#FC4E2A' :
         aqValue > 10 ? '#FD8D3C' :
                        '#FEB24C';
}

// Add fires layer to TimeDimension
const agFiresTimeLayer = L.timeDimension.layer.geoJson(agFiresLayer, {
  updateTime: (feature) => new Date(feature.properties.year, 0, 1).getTime(), // Use year only
});
agFiresTimeLayer.addTo(map);

// Add air quality layer to TimeDimension
const aqTimeLayer = L.timeDimension.layer.geoJson(aqLayer, {
  updateTime: (feature) => new Date(feature.properties.year, 0, 1).getTime(), // Use year only
});
aqTimeLayer.addTo(map);

// Add toggle button for air quality
const toggleButton = document.createElement('button');
toggleButton.innerHTML = 'Toggle Air Quality';
toggleButton.className = 'btn btn-secondary';
document.body.insertBefore(toggleButton, map);

let aqVisible = true;

toggleButton.addEventListener('click', () => {
  aqVisible = !aqVisible;
  if (aqVisible) {
    aqTimeLayer.addTo(map);
  } else {
    map.removeLayer(aqTimeLayer);
  }
});

// Adjust air quality layer opacity when fires are displayed
agFiresTimeLayer.on('add', () => {
  aqLayer.setStyle({ fillOpacity: 0.3 });
});

agFiresTimeLayer.on('remove', () => {
  aqLayer.setStyle({ fillOpacity: 0.7 });
});

// Add a legend
const legend = L.control({ position: 'bottomright' });

legend.onAdd = () => {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <h4>Air Quality</h4>
    <div><span style="background:#FEB24C"></span>0-10</div>
    <div><span style="background:#FD8D3C"></span>10-20</div>
    <div><span style="background:#FC4E2A"></span>20-30</div>
    <div><span style="background:#E31A1C"></span>30-40</div>
    <div><span style="background:#BD0026"></span>40-50</div>
    <div><span style="background:#800026"></span>50+</div>
  `;
  return div;
};

legend.addTo(map);