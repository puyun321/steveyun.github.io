// Initialize the second map
console.log("Initializing map2");
const map2 = L.map('map2').setView([23.4787, 120.4506], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map2);

const markersMap2 = []; // Initialize markers array for map2

// Function to determine color based on PM2.5 value
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Populate the file dropdown with CSV files from prediction data
async function populateFileDropdownForMap2() {
    try {
        const predDirectoryUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred?ref=gh-pages';
        const predDirectoryResponse = await fetch(predDirectoryUrl);
        const predFiles = await predDirectoryResponse.json();

        console.log('Prediction files:', predFiles); // Debugging line

        const fileSelect = document.getElementById('pred-fileSelect');
        fileSelect.innerHTML = ''; // Clear any existing options

        predFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                fileSelect.add(option);
            }
        });

        // Trigger a load on initial selection
        fileSelect.addEventListener('change', () => {
            loadAndMergeDataForMap2(fileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate the time step dropdown
function populateTimeSteps2() {
    const timeStepSelector = document.getElementById('pred-timeStep');
    if (!timeStepSelector) {
        console.error('Dropdown with id "pred-timeStep" not found');
        return;
    }
    for (let i = 0; i <= 72; i += 1) { // Adjust the step size as needed
        const optionValue = i === 0 ? 't' : 't+' + i;
        const optionText = i === 0 ? 't' : 't+' + i;
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = optionText;
        timeStepSelector.add(option);
    }
}

// Function to fetch file contents from GitHub
async function fetchGitHubFileContents(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.text();
    } catch (error) {
        console.error('Failed to fetch file:', error);
        return '';
    }
}

// Function to load and merge data from a selected CSV file for map2
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

        const timeStep = document.getElementById('pred-timeStep').value;

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
        console.error('Failed to load or merge data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateFileDropdownForMap2();
    populateTimeSteps2();

    // Trigger a load when a CSV file is selected
    document.getElementById('pred-fileSelect').addEventListener('change', function() {
        console.log('Selected prediction file:', this.value); // Debugging line
        loadAndMergeDataForMap2(this.value);
    });

    // Trigger a load when time step is changed
    document.getElementById('pred-timeStep').addEventListener('change', function() {
        console.log('Selected prediction time step:', this.value); // Debugging line
        loadAndMergeDataForMap2(document.getElementById('pred-fileSelect').value);
    });

    // Plot Kriging results on button click
    document.getElementById('kriging-button').addEventListener('click', function() {
        if (!csvData || !csvData.length) {
            console.error('Prediction data is missing');
            return;
        }

        // Open a new window and plot Kriging results
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        newWindow.document.write('<html><head><title>Kriging Results</title>');
        newWindow.document.write('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'); // Include Chart.js
        newWindow.document.write('<script src="path/to/krigingPlot.js"></script>'); // Adjust the path to your local script
        newWindow.document.write('</head><body>');
        newWindow.document.write('<h1>Kriging Results</h1>');
        newWindow.document.write('<canvas id="kriging-canvas" width="800" height="600"></canvas>');
        newWindow.document.write('<script>');
        newWindow.document.write('const predictionData = ' + JSON.stringify(csvData) + ';');
        newWindow.document.write('window.onload = function() { plotKrigingResults(predictionData); };');
        newWindow.document.write('</script>');
        newWindow.document.write('</body></html>');
        newWindow.document.close();
    });
});
