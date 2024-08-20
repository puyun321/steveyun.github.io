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

        // Automatically trigger load for the first file in the list
        if (fileSelect.options.length > 0) {
            loadAndMergeDataFromCSV(fileSelect.value);
        } else {
            console.warn('No CSV files found in the observation directory.');
            alert('No observation files available.');
        }
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
    for (let i = 1; i <= 72; i += 1) { // Adjust the step size as needed
        const optionValue =  't+' + i;
        const optionText =  't+' + i;
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

        // Calculate and display statistics
        await displayStatistics(stationData, csvData, timeStep);

    } catch (error) {
        console.error('Failed to load or merge data:', error);
    }
}

async function displayStatistics(stationData, pm25Data, timeStep) {
    // Check if data is provided
    if (!stationData || !pm25Data) {
        console.error('Missing data');
        return;
    }

    // Organize data by area
    const areaStats = {
        '北部': [],
        '中部': [],
        '南部': [],
        '東部': [],
        '外島': []
    };

    // Check the data structure
    console.log('Station Data:', stationData);
    console.log('PM2.5 Data:', pm25Data);

    // Populate areaStats with PM2.5 values
    stationData.forEach(station => {
        const area = station['Area'];
        if (areaStats[area] !== undefined) {
            const stationPM25 = pm25Data
                .filter(data => data['SITE ID'] === station['SITE ID'])
                .map(data => {
                    const value = parseFloat(data[timeStep]);
                    console.log(`SITE ID: ${data['SITE ID']}, PM2.5 Value: ${value}`);
                    return isNaN(value) ? null : value; // Filter out NaN values
                })
                .filter(value => value !== null); // Remove null values

            console.log(`Area: ${area}, PM2.5 Values:`, stationPM25);

            areaStats[area].push(...stationPM25);
        }
    });

    // Log the organized data
    console.log('Area Stats:', areaStats);

    // Calculate and display statistics
    Object.keys(areaStats).forEach(area => {
        const pm25Values = areaStats[area];
        if (pm25Values.length > 0) {
            const average = pm25Values.reduce((sum, value) => sum + value, 0) / pm25Values.length;
            const stddev = Math.sqrt(pm25Values.map(value => Math.pow(value - average, 2))
                                            .reduce((sum, value) => sum + value, 0) / pm25Values.length);
            const highest = Math.max(...pm25Values);

            console.log(`Region: ${area}`);
            console.log(`Average PM2.5: ${average.toFixed(2)}`);
            console.log(`Standard Deviation: ${stddev.toFixed(2)}`);
            console.log(`Highest PM2.5: ${highest.toFixed(2)}`);

            // Update the summary section on the webpage
            const avgElement = document.getElementById(`avg-${area}`);
            const stdElement = document.getElementById(`std-${area}`);
            const maxElement = document.getElementById(`max-${area}`);

            if (avgElement && stdElement && maxElement) {
                avgElement.textContent = average.toFixed(2);
                stdElement.textContent = stddev.toFixed(2);
                maxElement.textContent = highest.toFixed(2);
            } else {
                console.error(`Element IDs for region ${area} not found`);
            }
        } else {
            // Handle the case where no data is available for the area
            const avgElement = document.getElementById(`avg-${area}`);
            const stdElement = document.getElementById(`std-${area}`);
            const maxElement = document.getElementById(`max-${area}`);

            if (avgElement && stdElement && maxElement) {
                avgElement.textContent = 'N/A';
                stdElement.textContent = 'N/A';
                maxElement.textContent = 'N/A';
            } else {
                console.error(`Element IDs for region ${area} not found`);
            }
        }
    });
}


// Function to download observation data for all time steps from t+1 to t+72
async function downloadObservationData() {
    try {
        const fileUrl = document.getElementById('obs-fileSelect').value;
        if (!fileUrl) {
            alert('No observation file selected.');
            return;
        }

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Prepare the header (column names)
        const timeSteps = Array.from({ length: 72 }, (_, i) => 't+' + (i+1)); // 't+1' to 't+72'
        const header = ['SITE ID', ...timeSteps];

        // Prepare the data rows
        const siteIds = Array.from(new Set(csvData.map(row => row['SITE ID']))); // Get unique SITE IDs
        const allData = siteIds.map(siteId => {
            const row = { 'SITE ID': siteId };
            timeSteps.forEach(timeStep => {
                const siteData = csvData.find(r => r['SITE ID'] === siteId);
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
        link.download = 'observation_data_all_timesteps.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to download observation data:', error);
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
    document.getElementById('download-observation').addEventListener('click', downloadObservationData);
});
