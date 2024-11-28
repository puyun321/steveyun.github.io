let visitorCounts = {}; // Global object to store visitor counts
let showAll = false; // Toggle state for showing all or top 5 countries

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("All retries failed");
}


async function fetchVisitorData() {
    const geolocationApi = "https://ipapi.co/json/";
    const countApiBase = "https://api.countapi.xyz";

    try {
        console.log("Fetching geolocation data...");
        // Fetch the visitor's country
	const geoData = await fetchWithRetry(geolocationApi);
        console.log("Geolocation data:", geoData);

        const country = geoData.country_name || "Unknown";
        console.log("Visitor's country:", country);

        console.log("Incrementing visitor count...");
        // Increment the count for the visitor's country
        const countResponse = await fetch(`${countApiBase}/hit/visitor-counter/${country}`);
        if (!countResponse.ok) throw new Error("Failed to update visitor count");
        const countData = await countResponse.json();
        console.log("Updated visitor count:", countData);

        // Update visitorCounts globally
        visitorCounts[country] = countData.value;

        console.log("Current visitorCounts:", visitorCounts); // Debug log

        // Display the updated visitor counts
        displayVisitorCounts();
    } catch (error) {
        console.error("Error fetching visitor data:", error);
        document.getElementById("visitor-counts").innerHTML = `
            <p style="color: red;">Failed to fetch visitor data. Please try again later.</p>`;
    }
}

function displayVisitorCounts() {
    const visitorCountsDiv = document.getElementById("visitor-counts");

    // Clear previous content
    visitorCountsDiv.innerHTML = "";

    // Convert visitorCounts object into an array and sort by count
    const sortedCountries = Object.keys(visitorCounts)
        .map(country => ({ country, count: visitorCounts[country] }))
        .sort((a, b) => b.count - a.count);

    // Determine which countries to display
    const countriesToShow = showAll ? sortedCountries : sortedCountries.slice(0, 5);

    if (countriesToShow.length === 0) {
        visitorCountsDiv.innerHTML = "<p>No visitor data available.</p>";
        return;
    }

    countriesToShow.forEach(({ country, count }) => {
        const countryDiv = document.createElement("div");
        countryDiv.className = "country-count";
        countryDiv.textContent = `${country}: ${count} visitor(s)`;
        visitorCountsDiv.appendChild(countryDiv);
    });

    // Update the toggle button text
    const toggleButton = document.getElementById("toggle-button");
    toggleButton.textContent = showAll ? "Show Top 5" : "Show All";
}

function toggleCountries() {
    showAll = !showAll;
    displayVisitorCounts();
}

// Fetch and display visitor data on page load
fetchVisitorData();

// Refresh visitor data every 30 seconds
setInterval(fetchVisitorData, 30000);