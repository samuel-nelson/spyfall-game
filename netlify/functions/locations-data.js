// Location data for backend use - Pack names only (for random selection)
const PACK1_LOCATION_NAMES = [
    "Airplane", "Bank", "Beach", "Casino", "Cathedral", "Circus Tent",
    "Corporate Party", "Crusader Army", "Day Spa", "Embassy", "Hospital",
    "Hotel", "Military Base", "Movie Studio", "Ocean Liner", "Passenger Train",
    "Pirate Ship", "Polar Station", "Police Station", "Restaurant", "School",
    "Service Station", "Space Station", "Submarine", "Supermarket", "Theater",
    "University", "World War II Squad"
];

const PACK2_LOCATION_NAMES = [
    "Airport", "Amusement Park", "Art Gallery", "Baseball Stadium", "Broadway Theater",
    "Cemetery", "Construction Site", "Cruise Ship", "Desert Island", "Gas Station",
    "Jail", "Library", "Mall", "Night Club", "Park", "Prison", "Race Track",
    "Retirement Home", "Rock Concert", "Ski Resort", "Subway", "Temple", "UFO",
    "Vineyard", "Wedding", "Zoo"
];

const COUNTRIES_PACK_NAMES = [
    "Russia", "United States", "United Kingdom", "China", "Israel", "Germany",
    "France", "Japan", "Iran", "North Korea", "Turkey", "India", "South Korea",
    "Pakistan", "Saudi Arabia", "Brazil", "Mexico", "Canada", "Australia",
    "Italy", "Spain", "Netherlands", "Poland", "Czech Republic"
];

function getRandomLocation(enabledPacks = ['pack1']) {
    let allLocations = [];
    
    if (enabledPacks.includes('pack1')) {
        allLocations = allLocations.concat(PACK1_LOCATION_NAMES);
    }
    
    if (enabledPacks.includes('pack2')) {
        allLocations = allLocations.concat(PACK2_LOCATION_NAMES);
    }
    
    if (enabledPacks.includes('countries')) {
        allLocations = allLocations.concat(COUNTRIES_PACK_NAMES);
    }
    
    if (allLocations.length === 0) {
        allLocations = PACK1_LOCATION_NAMES; // Fallback
    }
    
    return allLocations[Math.floor(Math.random() * allLocations.length)];
}

module.exports = {
    PACK1_LOCATION_NAMES,
    PACK2_LOCATION_NAMES,
    COUNTRIES_PACK_NAMES,
    getRandomLocation
};
