// Initialize the second map
console.log("Initializing map2");
const map2 = L.map('map2').setView([23.4787, 120.4506], 7);
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

// Populate the directory dropdown with directories from the prediction data
async function populateDirectoryDropdownForMap2() {
    try {
        const baseUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred?ref=gh-pages';
        const directoryResponse = await fetch(baseUrl);
        const directories = await directoryResponse.json();

        console.log('Prediction directories:', directories); // Debugging line

        const directorySelect = document.getElementById('pred-directorySelect');
        directorySelect.innerHTML = ''; // Clear any existing options

        directories.forEach(dir => {
            if (dir.type === 'dir') { // Only include directories
                const option = document.createElement('option');
                option.value = dir.path;
                option.text = dir.name;
                directorySelect.add(option);
            }
        });

        // Trigger a load on initial selection
        directorySelect.addEventListener('change', () => {
            populateFileDropdownForMap2(directorySelect.value);
        });

        // Populate the file dropdown for the first directory by default
        if (directories.length > 0) {
            populateFileDropdownForMap2(directories[0].path);
        }
    } catch (error) {
        console.error('Failed to fetch directories:', error);
    }
}

// Populate the file dropdown with CSV files from the selected directory
async function populateFileDropdownForMap2(directoryPath) {
    try {
        const predDirectoryUrl = `https://api.github.com/repos/puyun321/puyun321.github.io/contents/${directoryPath}?ref=gh-pages`;
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
        if (predFiles.length > 0) {
            loadAndMergeDataForMap2(predFiles[0].download_url);
        }
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

// Function to download forecast data for all time steps from t to t+72
async function downloadForecastData() {
    try {
        const fileUrl = document.getElementById('pred-fileSelect').value;
        if (!fileUrl) {
            alert('No forecast file selected.');
            return;
        }

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Prepare the header (column names)
        const timeSteps = Array.from({ length: 73 }, (_, i) => i === 0 ? 't' : 't+' + i); // 't' to 't+72'
        const header = ['SITE ID', ...timeSteps];

        // Prepare the data rows
        const siteIds = Array.from(new Set(csvData.map(row => row['SITE ID']))); // Get unique SITE IDs
        const allData = siteIds.map(siteId => {
            const row = { 'SITE ID': siteId };
            timeSteps.forEach(timeStep => {
                const siteData = csvData.find(row => row['SITE ID'] === siteId);
                row[timeStep] = siteData ? siteData[timeStep] : '';
            });
            return row;
        });

        // Convert data to CSV format
        const csvContent = Papa.unparse({
            fields: header,
            data: allData.map(row => header.map(field => row[field]))
        });

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'forecast_data_all_timesteps.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to download forecast data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateDirectoryDropdownForMap2();
    populateTimeSteps2();

    // Trigger a load when a directory is selected
    document.getElementById('pred-directorySelect').addEventListener('change', function() {
        console.log('Selected prediction directory:', this.value); // Debugging line
        populateFileDropdownForMap2(this.value);
    });

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

    // Add event listener for download button
    document.getElementById('download-forecast').addEventListener('click', function() {
        downloadForecastData();
    });
});
