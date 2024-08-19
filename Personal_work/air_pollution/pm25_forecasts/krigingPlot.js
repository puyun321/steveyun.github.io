// Function to perform Kriging interpolation and plot results
function plotKrigingResults(observationData) {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available.');
        return;
    }

    // Example: Perform Kriging interpolation (this is a placeholder)
    // Replace this with your actual Kriging implementation
    const krigingResults = performKriging(observationData);

    // Prepare data for plotting
    const labels = krigingResults.map(result => result.label); // Replace with appropriate labels
    const data = krigingResults.map(result => result.value); // Replace with appropriate data values

    // Create a chart
    const ctx = document.getElementById('kriging-canvas').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Or 'scatter' depending on your data
        data: {
            labels: labels,
            datasets: [{
                label: 'Kriging Interpolation Results',
                data: data,
                borderColor: '#FF0000',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return 'Value: ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
}

// Placeholder function for Kriging interpolation
// Replace this with your actual Kriging implementation
function performKriging(observationData) {
    // Example: Generate synthetic results (replace with actual computation)
    return observationData.map((data, index) => ({
        label: `Point ${index + 1}`,
        value: Math.random() * 100 // Replace with actual Kriging result
    }));
}

// Ensure the script runs after the page content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // If this script is included in the dynamically created window
    if (window.opener && window.opener.plotKrigingResults) {
        window.opener.plotKrigingResults(window.opener.observationData);
    }
});
