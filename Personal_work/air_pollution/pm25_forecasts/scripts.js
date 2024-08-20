// Initialize the map for observations
console.log("Initializing map1");
const map1 = L.map('map1').setView([23.4787, 120.4506], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map1);

const markers = []; // Initialize markers array

// Function to determine color based on PM2.5 value
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Populate the file dropdown with CSV files from observation data
async function populateFileDropdown() {
    try {
        const obsDirectoryUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs?ref=gh-pages';
        const obsDirectoryResponse = await fetch(obsDirectoryUrl);
        if (!obsDirectoryResponse.ok) throw new Error('Failed to fetch observation files');
        const obsFiles = await obsDirectoryResponse.json();

        console.log('Observation files:', obsFiles); // Debugging line

        const fileSelect = document.getElementById('obs-fileSelect');
        fileSelect.innerHTML = ''; // Clear any existing options

        obsFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                fileSelect.add(option);
            }
        });

        // Trigger a load on initial selection
        fileSelect.addEventListener('change', () => {
            loadAndMergeDataFromCSV(fileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate the time step dropdown for observations
function populateTimeSteps() {
    const timeStepSelector = document.getElementById('obs-timeStep');
    if (!timeStepSelector) {
        console.error('Dropdown with id "obs-timeStep" not found');
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

// Function to load and merge data from a selected CSV file for map1
async function loadAndMergeDataFromCSV(fileUrl) {
    try {
        console.log('Loading data from CSV for map1');
        const stationInfoUrl = 'https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/station_info.csv';
        const stationInfoText = await fetchGitHubFileContents(stationInfoUrl);
        const stationData = Papa.parse(stationInfoText, { header: true }).data;

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markers.forEach(marker => map1.removeLayer(marker));
        markers.length = 0;

        const timeStep = document.getElementById('obs-timeStep').value;

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
                }).addTo(map1);

                marker.bindPopup(
                    '<b>' + (matchingStation ? matchingStation['StationName'] : 'Unknown Station') + '</b><br>' +
                    'PM2.5: ' + value + '<br>' +
                    'Area: ' + (matchingStation ? matchingStation['Area'] : 'Unknown Area') + '<br>' +
                    'County: ' + (matchingStation ? matchingStation['County'] : 'Unknown County') + '<br>' +
                    'Location: ' + (matchingStation ? matchingStation['Location'] : 'Unknown Location') + '<br>' +
                    'Address: ' + (matchingStation ? matchingStation['Address'] : 'Unknown Address')
                );
                markers.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge data:', error);
    }
}

// Function to download data as CSV
function downloadCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}

// Function to generate CSV data from observation data
async function generateCSVData() {
    const fileUrl = document.getElementById('obs-fileSelect').value;
    if (!fileUrl) {
        alert('Please select an observation file first.');
        return;
    }

    try {
        console.log('Generating CSV data for download');
        const stationInfoUrl = 'https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/station_info.csv';
        const stationInfoText = await fetchGitHubFileContents(stationInfoUrl);
        const stationData = Papa.parse(stationInfoText, { header: true }).data;

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        const timeStep = document.getElementById('obs-timeStep').value;
        const csvRows = [];
        csvRows.push(['Site ID', 'Station Name', 'PM2.5', 'Area', 'County', 'Location', 'Address']); // Header row

        csvData.forEach(demoRow => {
            const matchingStation = stationData.find(stationRow => stationRow['SITE ID'] === demoRow['SITE ID']);
            const value = parseFloat(demoRow[timeStep]);

            if (!isNaN(value)) {
                csvRows.push([
                    demoRow['SITE ID'],
                    matchingStation ? matchingStation['StationName'] : 'Unknown Station',
                    value,
                    matchingStation ? matchingStation['Area'] : 'Unknown Area',
                    matchingStation ? matchingStation['County'] : 'Unknown County',
                    matchingStation ? matchingStation['Location'] : 'Unknown Location',
                    matchingStation ? matchingStation['Address'] : 'Unknown Address'
                ]);
            }
        });

        downloadCSV(csvRows, 'observation_data.csv');
    } catch (error) {
        console.error('Failed to generate CSV data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateFileDropdown();
    populateTimeSteps(); // Ensure this function is called

    // Trigger a load when a CSV file is selected
    document.getElementById('obs-fileSelect').addEventListener('change', function() {
        console.log('Selected observation file:', this.value);
        loadAndMergeDataFromCSV(this.value);
    });

    // Trigger a load when time step is changed
    document.getElementById('obs-timeStep').addEventListener('change', function() {
        console.log('Selected observation time step:', this.value);
        loadAndMergeDataFromCSV(document.getElementById('obs-fileSelect').value);
    });

    // Add event listener for the download button
    document.getElementById('download-button').addEventListener('click', generateCSVData);
});
