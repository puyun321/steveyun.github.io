const obsDirectoryUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs?ref=gh-pages';
const predDirectoryUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred?ref=gh-pages';

// Populate the file dropdown with datetime options
async function populateFileDropdown() {
    try {
        const response = await fetch(obsDirectoryUrl);
        if (!response.ok) throw new Error('Failed to fetch observation files');

        const files = await response.json();

        const datetimeDropdown = document.getElementById('fileSelect');
        datetimeDropdown.innerHTML = ''; // Clear existing options

        files.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.name;
                option.textContent = file.name;
                datetimeDropdown.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error populating dropdown:', error);
        alert('Failed to populate dropdown.');
    }
}

// Fetch and plot both observation and prediction data
async function fetchAndPlotData() {
    const dropdown = document.getElementById('fileSelect');
    const datetime = dropdown.value || dropdown.options[0]?.value;

    if (!datetime) {
        alert('Please select a valid datetime!');
        return;
    }

    const obsFileUrl = `https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/obs/${datetime}`;
    const predFileUrl = `https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/pred/MCNN-BP/${datetime}`;

    try {
        const [obsResponse, predResponse] = await Promise.all([
            fetch(obsFileUrl),
            fetch(predFileUrl)
        ]);

        if (!obsResponse.ok || !predResponse.ok) {
            throw new Error('Failed to fetch observation or prediction files.');
        }

        const [obsText, predText] = await Promise.all([
            obsResponse.text(),
            predResponse.text()
        ]);

        const obsData = parseCSV(obsText);
        const predData = parseCSV(predText);

        console.log('Observation Data:', obsData);
        console.log('Prediction Data:', predData);

        populateStationDropdown(obsData, predData);
        plotCombinedData(obsData, predData);
    } catch (error) {
        console.error('Error fetching or processing data:', error);
        alert('Failed to fetch or process data. See console for details.');
    }
}

// Parse CSV data into an object
function parseCSV(csv) {
    const rows = csv.split('\n').map(row => row.split(','));
    const headers = rows.shift();
    return rows.map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = row[index];
            return acc;
        }, {});
    });
}

// Populate station dropdown dynamically
function populateStationDropdown(obsData, predData) {
    const stationDropdown = document.getElementById('station-select');
    stationDropdown.innerHTML = ''; // Clear existing options

    const uniqueStations = [...new Set([...obsData, ...predData].map(row => row['SITE ID']))];
    uniqueStations.forEach(stationId => {
        const option = document.createElement('option');
        option.value = stationId;
        option.textContent = stationId;
        stationDropdown.appendChild(option);
    });

    stationDropdown.addEventListener('change', () => plotCombinedData(obsData, predData));
}

// Plot both observation and prediction data on one chart
function plotCombinedData(obsData, predData) {
    const stationDropdown = document.getElementById('station-select');
    const selectedStation = stationDropdown.value || stationDropdown.options[0]?.value;

    const obsStationData = obsData.filter(row => row['SITE ID'] === selectedStation);
    const predStationData = predData.filter(row => row['SITE ID'] === selectedStation);

    if (!obsStationData.length || !predStationData.length) {
        alert('No data available for the selected station.');
        return;
    }

    const labels = Array.from({ length: 72 }, (_, i) => `t+${i + 1}`);
    const obsDataset = obsStationData.map(row => {
        const values = labels.map(label => parseFloat(row[label]) || 0);
        return {
            label: `${row['SITE ID']} (Observation)`,
            data: values,
            borderColor: 'rgba(0, 0, 0, 1)', // Observation color
            fill: false,
            tension: 0.1
        };
    });

    const predDataset = predStationData.map(row => {
        const values = labels.map(label => parseFloat(row[label]) || 0);
        return {
            label: `${row['SITE ID']} (Prediction)`,
            data: values,
            borderColor: 'rgba(255, 99, 132, 1)', // Prediction color
            fill: false,
            tension: 0.1
        };
    });

    const ctx = document.getElementById('combined-chart').getContext('2d');
    if (window.combinedChart) {
        window.combinedChart.destroy();
    }
    window.combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [...obsDataset, ...predDataset]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: {color: 'black'} }
            },
            scales: {
                x: { title: { display: true, text: 'Forecast Hours', color: 'black'},                     
			ticks: { color: 'black'}},
                y: { title: { display: true, text: 'PM2.5 Concentration (µg/m³)', color: 'black'},
			ticks: { color: 'black'}}
            }
        }
    });
}

// Initialize dropdown and listeners
document.addEventListener('DOMContentLoaded', function () {
    populateFileDropdown();
    document.getElementById('fileSelect').addEventListener('change', fetchAndPlotData);
});
