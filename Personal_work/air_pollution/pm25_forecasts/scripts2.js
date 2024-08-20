// Initialize the prediction map
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

// Populate the directory dropdown with directories from the prediction data
async function populateDirectoryDropdownForMap2() {
    try {
        const baseUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred?ref=gh-pages';
        const directoryResponse = await fetch(baseUrl);
        if (!directoryResponse.ok) throw new Error('Failed to fetch prediction directories');
        const directories = await directoryResponse.json();

        console.log('Prediction directories:', directories); // Debugging line

        const directorySelect = document.getElementById('pred-directorySelect');
        if (!directorySelect) {
            console.error('Dropdown with id "pred-directorySelect" not found');
            return;
        }
        directorySelect.innerHTML = ''; // Clear any existing options

        directories.forEach(dir => {
            if (dir.type === 'dir') { // Only include directories
                const option = document.createElement('option');
                option.value = dir.path;
                option.text = dir.name;
                directorySelect.add(option);
            }
        });

        // Trigger file dropdown population when a directory is selected
        directorySelect.addEventListener('change', () => {
            populateFileDropdownForMap2(); // Populate files based on selected directory
        });
    } catch (error) {
        console.error('Failed to fetch directories:', error);
    }
}

// Populate the file dropdown with CSV files from the prediction data
async function populateFileDropdownForMap2() {
    try {
        const directoryPath = document.getElementById('pred-directorySelect').value;
        if (!directoryPath) {
            console.warn('No directory selected');
            return;
        }

        const directoryUrl = `https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred/${directoryPath}?ref=gh-pages`;
        const directoryResponse = await fetch(directoryUrl);
        if (!directoryResponse.ok) throw new Error('Failed to fetch prediction files');
        const files = await directoryResponse.json();

        console.log('Prediction files:', files); // Debugging line

        const fileSelect = document.getElementById('pred-fileSelect');
        if (!fileSelect) {
            console.error('Dropdown with id "pred-fileSelect" not found');
            return;
        }
        fileSelect.innerHTML = ''; // Clear any existing options

        files.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                fileSelect.add(option);
            }
        });

        // Trigger data load when a CSV file is selected
        fileSelect.addEventListener('change', () => {
            loadAndMergeDataForMap2(fileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Function to load and merge prediction data from a selected CSV file
async function loadAndMergeDataForMap2(fileUrl) {
    try {
        console.log('Loading prediction data from CSV');
        const csvText = await fetch(fileUrl).then(response => response.text());
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markersMap2.forEach(marker => map2.removeLayer(marker));
        markersMap2.length = 0;

        const timeStep = document.getElementById('pred-timeStep').value;

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
                }).addTo(map2);

                marker.bindPopup(
                    '<b>Station</b><br>' +
                    'PM2.5: ' + value + '<br>'
                );
                markersMap2.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge prediction data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateDirectoryDropdownForMap2(); // Populate prediction directories
});
