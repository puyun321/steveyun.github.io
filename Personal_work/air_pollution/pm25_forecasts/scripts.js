// Initialize the observation map
const map1 = L.map('map1').setView([23.4787, 120.4506], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map1);

const markersMap1 = []; // Initialize markers array for map1

// Function to determine color based on PM2.5 value
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Populate the directory dropdown with directories from the observation data
async function populateObservationDirectoryDropdown() {
    try {
        const baseUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs?ref=gh-pages';
        const directoryResponse = await fetch(baseUrl);
        if (!directoryResponse.ok) throw new Error('Failed to fetch observation directories');
        const directories = await directoryResponse.json();

        console.log('Observation directories:', directories); // Debugging line

        const obsDirectorySelect = document.getElementById('obs-fileSelect');
        if (!obsDirectorySelect) {
            console.error('Dropdown with id "obs-fileSelect" not found');
            return;
        }
        obsDirectorySelect.innerHTML = ''; // Clear any existing options

        directories.forEach(dir => {
            if (dir.type === 'dir') { // Only include directories
                const option = document.createElement('option');
                option.value = dir.path;
                option.text = dir.name;
                obsDirectorySelect.add(option);
            }
        });

        // Trigger file dropdown population when a directory is selected
        obsDirectorySelect.addEventListener('change', () => {
            populateObservationFileDropdown(); // Populate files based on selected directory
        });

        // Populate time steps
        populateObservationTimeSteps();
    } catch (error) {
        console.error('Failed to fetch directories:', error);
    }
}

// Populate the file dropdown with CSV files from the observation data
async function populateObservationFileDropdown() {
    try {
        const obsDirectoryPath = document.getElementById('obs-fileSelect').value;
        if (!obsDirectoryPath) {
            console.warn('No directory selected');
            return;
        }

        const obsDirectoryUrl = `https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs/${obsDirectoryPath}?ref=gh-pages`;
        const obsDirectoryResponse = await fetch(obsDirectoryUrl);
        if (!obsDirectoryResponse.ok) throw new Error('Failed to fetch observation files');
        const obsFiles = await obsDirectoryResponse.json();

        console.log('Observation files:', obsFiles); // Debugging line

        const obsFileSelect = document.getElementById('obs-fileSelect');
        if (!obsFileSelect) {
            console.error('Dropdown with id "obs-fileSelect" not found');
            return;
        }
        obsFileSelect.innerHTML = ''; // Clear any existing options

        obsFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                obsFileSelect.add(option);
            }
        });

        // Trigger data load when a CSV file is selected
        obsFileSelect.addEventListener('change', () => {
            loadAndMergeObservationData(obsFileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate time steps for observation data
function populateObservationTimeSteps() {
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

// Function to load and merge observation data from a selected CSV file
async function loadAndMergeObservationData(fileUrl) {
    try {
        console.log('Loading observation data from CSV');
        const csvText = await fetch(fileUrl).then(response => response.text());
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markersMap1.forEach(marker => map1.removeLayer(marker));
        markersMap1.length = 0;

        const timeStep = document.getElementById('obs-timeStep').value;

        csvData.forEach(demoRow => {
            const lat = parseFloat(demoRow['lat']);
            const lon = parseFloat(demoRow['lon']);
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
                    '<b>Station</b><br>' +
                    'PM2.5: ' + value + '<br>'
                );
                markersMap1.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge observation data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateObservationDirectoryDropdown(); // Populate observation directories

    // Trigger data load when time step is changed for observations
    document.getElementById('obs-timeStep').addEventListener('change', function() {
        console.log('Selected observation time step:', this.value);
        loadAndMergeObservationData(document.getElementById('obs-fileSelect').value);
    });
});
