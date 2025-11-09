// Location data for backend use
// Spyfall 1 locations
const SPYFALL1_LOCATIONS = [
    "Airplane", "Bank", "Beach", "Casino", "Cathedral", "Circus Tent",
    "Corporate Party", "Crusader Army", "Day Spa", "Embassy", "Hospital",
    "Hotel", "Military Base", "Movie Studio", "Ocean Liner", "Passenger Train",
    "Pirate Ship", "Polar Station", "Police Station", "Restaurant", "School",
    "Service Station", "Space Station", "Submarine", "Supermarket", "Theater",
    "University", "World War II Squad"
];

// Spyfall 2 locations (same as Spyfall 1 for now - can be expanded)
const SPYFALL2_LOCATIONS = SPYFALL1_LOCATIONS;

function getRandomLocation(enabledSets = ['spyfall1'], customLocations = [], enabledLocationsList = null) {
    let allLocations = [];
    
    // If individual location selection is provided, use that
    if (enabledLocationsList && Array.isArray(enabledLocationsList) && enabledLocationsList.length > 0) {
        enabledLocationsList.forEach(locationId => {
            const [set, ...nameParts] = locationId.split('-');
            const name = nameParts.join('-');
            
            if (set === 'spyfall1') {
                const loc = SPYFALL1_LOCATIONS.find(l => l === name);
                if (loc) allLocations.push(loc);
            } else if (set === 'spyfall2') {
                const loc = SPYFALL2_LOCATIONS.find(l => l === name);
                if (loc) allLocations.push(loc);
            } else if (set === 'custom') {
                const loc = customLocations.find(l => (typeof l === 'string' ? l : l.name) === name);
                if (loc) {
                    allLocations.push(typeof loc === 'string' ? loc : loc.name);
                }
            }
        });
        
        if (allLocations.length > 0) {
            return allLocations[Math.floor(Math.random() * allLocations.length)];
        }
    }
    
    // Fallback to set-based selection
    if (enabledSets.includes('spyfall1')) {
        allLocations = allLocations.concat(SPYFALL1_LOCATIONS);
    }
    
    if (enabledSets.includes('spyfall2')) {
        allLocations = allLocations.concat(SPYFALL2_LOCATIONS);
    }
    
    if (enabledSets.includes('custom') && customLocations.length > 0) {
        const customNames = customLocations.map(loc => typeof loc === 'string' ? loc : loc.name);
        allLocations = allLocations.concat(customNames);
    }
    
    if (allLocations.length === 0) {
        allLocations = SPYFALL1_LOCATIONS; // Fallback
    }
    
    return allLocations[Math.floor(Math.random() * allLocations.length)];
}

module.exports = {
    SPYFALL1_LOCATIONS,
    SPYFALL2_LOCATIONS,
    getRandomLocation
};

