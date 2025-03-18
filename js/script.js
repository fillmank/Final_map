// Initialize the map
const map = L.map('map').setView([37.8, -96], 4);

// Add a base layer (e.g., OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load states boundary layer
const statesLayer = L.geoJSON.ajax('data/states.geojson', {
  style: { color: '#555', weight: 2, fillOpacity: 0 }
}).addTo(map);

// Load aggregated fires layer
const agFiresLayer = L.geoJSON.ajax('data/ag_fires.geojson', {
  pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 5, color: 'red', fillOpacity: 0.5 })
});

// Load air quality layer
const aqLayer = L.geoJSON.ajax('data/aq_yearly.geojson', {
  style: (feature) => ({
    fillColor: getColor(feature.properties.aq_value), // Define getColor function based on air quality value
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7
  })
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

// Initialize TimeDimension
const timeDimension = new L.TimeDimension({
    timeInterval: "2005-01-01/2020-12-31",
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
  
  // Add fires layer to TimeDimension
  const agFiresTimeLayer = L.timeDimension.layer.geoJson(agFiresLayer, {
    updateTime: (feature) => new Date(feature.properties.year).getTime(),
  }).addTo(map);
  
  // Add air quality layer to TimeDimension
  const aqTimeLayer = L.timeDimension.layer.geoJson(aqLayer, {
    updateTime: (feature) => new Date(feature.properties.year).getTime(),
  }).addTo(map);

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