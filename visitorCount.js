let showAll = false;

const visitorCounts = {
    "Malaysia": 0,
    "China": 0,
    "Taiwan": 1,
    "Korea": 0,
    "Japan": 0,
    "India": 0,
    "United States": 0,
    "Canada": 0,
    "France": 0,
    "Germany": 0,
    "Italy": 0,
    "Spain": 0,
    "Thailand": 0,
    "Vietnam": 0,
    "Indonesia": 0
};

// Add country codes based on country names
const countryCodes = {
  "Malaysia": "MY",
  "China": "CN",
  "Taiwan": "TW",
  "Korea": "KR",
  "Japan": "JP",
  "India": "IN",
  "United States": "US",
  "Canada": "CA",
  "France": "FR",
  "Germany": "DE",
  "Italy": "IT",
  "Spain": "ES",
  "Thailand": "TH",
  "Vietnam": "VN",
  "Indonesia": "ID"
};

// Function to update the visitor count for a country
function updateVisitorCount(country) {
    if (visitorCounts[country] !== undefined) {
        visitorCounts[country]++;
    } else {
        visitorCounts[country] = 1;
    }

    displayVisitorCounts();
}

// Function to display visitor counts on the webpage
function displayVisitorCounts() {
    const visitorCountsDiv = document.getElementById('visitor-counts');
    visitorCountsDiv.innerHTML = ''; // Clear previous data
    visitorCountsDiv.style.display = 'flex'; // Display items in a row
    visitorCountsDiv.style.flexWrap = 'wrap'; // Allow wrapping to new rows

    // Convert the visitorCounts object into an array and sort by count
    const sortedCountries = Object.keys(visitorCounts)
        .map(country => ({ country, count: visitorCounts[country] }))
        .sort((a, b) => b.count - a.count);

    // Show only the top 5 if showAll is false
    const countriesToShow = showAll ? sortedCountries : sortedCountries.slice(0, 5);

    countriesToShow.forEach(({ country, count }) => {
        // Create a container for each country's info
        const countryContainer = document.createElement('div');
        countryContainer.className = 'country-container';

        // Create the flag image
        const flag = document.createElement('img');
        flag.className = 'flag';
	flag.src = `https://flagsapi.com/{countryCodes[country]}/shiny/64.png`

        // Create a label for the country
        const countryLabel = document.createElement('span');
        countryLabel.className = 'country-label';
        countryLabel.textContent = country;

        // Create the bar
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.width = `${count * 10}px`; // Adjust the multiplier for desired bar width

        // Create a label for the count
        const countLabel = document.createElement('span');
        countLabel.className = 'count-label';
        countLabel.textContent = count;

        // Append the flag, country label, bar, and count label to the country container
        countryContainer.appendChild(flag);
        countryContainer.appendChild(countryLabel);
        countryContainer.appendChild(bar);
        countryContainer.appendChild(countLabel);

        // Append the country container to the main div
        visitorCountsDiv.appendChild(countryContainer);
    });
}

// Function to toggle between showing top 5 and all countries
function toggleCountries() {
    showAll = !showAll;
    const toggleButton = document.getElementById('toggle-button');
    toggleButton.textContent = showAll ? "Show Top 5" : "Show All";
    displayVisitorCounts();
}

// Fetch the visitor's IP and determine the country
function fetchVisitorCountry() {
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const country = data.country_name;
            updateVisitorCount(country);
        })
        .catch(error => console.error('Error fetching visitor country:', error));
}


