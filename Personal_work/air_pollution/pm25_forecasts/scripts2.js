// Initialize the second map
console.log("Initializing map2");
const map2 = L.map('map2').setView([24.1469, 120.6839], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map2);

const markersMap2 = []; // Initialize markers array for map2

// Function to determine color based on PM2.5 value (same as map1)
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Function to load and merge data for map2 (if different from map1, adjust accordingly)
async function loadAndMergeDataForMap2(fileUrl) {
    try {
        console.log('Loading data from CSV for map2');
        const stationInfoUrl = 'https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/station_info.csv';
        const stationInfoText = await fetchGitHubFileContents(stationInfoUrl);
        const stationData = Papa.parse(stationInfoText, { header: true }).data;

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markersMap2.forEach(marker => map2.removeLayer(marker));
        markersMap2.length = 0;

        const timeStep = document.getElementById('timeStep').value;

        csvData.forEach(demoRow => {
            const matchingStation = stationData.find(stationRow => stationRow['SITE ID'] === demoRow['SITE ID']);
            const lat = parseFloat(matchingStation ? matchingStation['lat'] : null);
            const lon = parseFloat(matchingStation ? matchingStation['lon'] : null);
            const value = parseFloat(demoRow[timeStep]);

            if (!isNaN(lat) && !isNaN(lon)) {
                const color = getColor(value);
                const marker = L.circleMarker([lat, lon], {
                    radius: 8,
                    fillColor: color,
                    color: color,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map2);

                marker.bindPopup(
                    '<b>' + (matchingStation ? matchingStation['StationName'] : 'Unknown Station') + '</b><br>' +
                    'PM2.5: ' + value + '<br>' +
                    'Area: ' + (matchingStation ? matchingStation['Area'] : 'Unknown Area') + '<br>' +
                    'County: ' + (matchingStation ? matchingStation['County'] : 'Unknown County') + '<br>' +
                    'Location: ' + (matchingStation ? matchingStation['Location'] : 'Unknown Location') + '<br>' +
                    'Address: ' + (matchingStation ? matchingStation['Address'] : 'Unknown Address')
                );
                markersMap2.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge data for map2:', error);
    }
}

// Additional functionalities or initial setup for map2 can be added here
// Example: update map2 when the file or time step is changed
document.addEventListener('DOMContentLoaded', function() {
    const fileSelect = document.getElementById('fileSelect');
    const timeStepSelect = document.getElementById('timeStep');

    // Trigger a load for map2 when a CSV file is selected
    fileSelect.addEventListener('change', function() {
        loadAndMergeDataForMap2(this.value);
    });

    // Trigger a load for map2 when time step is changed
    timeStepSelect.addEventListener('change', function() {
        loadAndMergeDataForMap2(fileSelect.value);
    });
});
