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

// Full location data with roles (for role assignment)
const PACK1_LOCATIONS_FULL = [
    { name: "Airplane", roles: ["Pilot", "Passenger", "Flight Attendant", "Mechanic", "Air Marshal"] },
    { name: "Bank", roles: ["Teller", "Customer", "Security Guard", "Manager", "Robber"] },
    { name: "Beach", roles: ["Lifeguard", "Swimmer", "Beach Goer", "Ice Cream Vendor", "Photographer"] },
    { name: "Casino", roles: ["Dealer", "Gambler", "Security", "Bartender", "Manager"] },
    { name: "Cathedral", roles: ["Priest", "Worshipper", "Tourist", "Choir Member", "Janitor"] },
    { name: "Circus Tent", roles: ["Clown", "Acrobat", "Juggler", "Ringmaster", "Spectator"] },
    { name: "Corporate Party", roles: ["Manager", "Employee", "Intern", "CEO", "Entertainer"] },
    { name: "Crusader Army", roles: ["Knight", "Archer", "Monk", "Servant", "Spy"] },
    { name: "Day Spa", roles: ["Client", "Masseuse", "Receptionist", "Stylist", "Masseur"] },
    { name: "Embassy", roles: ["Ambassador", "Diplomat", "Security", "Government Official", "Refugee"] },
    { name: "Hospital", roles: ["Doctor", "Nurse", "Patient", "Surgeon", "Visitor"] },
    { name: "Hotel", roles: ["Guest", "Receptionist", "Bellhop", "Maid", "Manager"] },
    { name: "Military Base", roles: ["Soldier", "Officer", "Medic", "Engineer", "Spy"] },
    { name: "Movie Studio", roles: ["Director", "Actor", "Cameraman", "Stuntman", "Costume Designer"] },
    { name: "Ocean Liner", roles: ["Captain", "Passenger", "Bartender", "Mechanic", "Rich Passenger"] },
    { name: "Passenger Train", roles: ["Mechanic", "Passenger", "Conductor", "Restaurant Chef", "Border Patrol"] },
    { name: "Pirate Ship", roles: ["Captain", "Sailor", "Cook", "Slave", "Cannoneer"] },
    { name: "Polar Station", roles: ["Scientist", "Explorer", "Medic", "Geologist", "Meteorologist"] },
    { name: "Police Station", roles: ["Criminal", "Detective", "Journalist", "Lawyer", "Police Officer"] },
    { name: "Restaurant", roles: ["Waiter", "Customer", "Chef", "Critic", "Owner"] },
    { name: "School", roles: ["Teacher", "Student", "Principal", "Janitor", "Parent"] },
    { name: "Service Station", roles: ["Manager", "Tire Specialist", "Biker", "Car Owner", "Mechanic"] },
    { name: "Space Station", roles: ["Engineer", "Alien", "Pilot", "Commander", "Scientist"] },
    { name: "Submarine", roles: ["Captain", "Sailor", "Cook", "Radioman", "Mechanic"] },
    { name: "Supermarket", roles: ["Customer", "Cashier", "Butcher", "Janitor", "Security Guard"] },
    { name: "Theater", roles: ["Actor", "Audience Member", "Coat Check Lady", "Director", "Prompter"] },
    { name: "University", roles: ["Graduate Student", "Professor", "Dean", "Student", "Janitor"] },
    { name: "World War II Squad", roles: ["Soldier", "Medic", "Radioman", "Sniper", "Officer"] }
];

const PACK2_LOCATIONS_FULL = [
    { name: "Airport", roles: ["Pilot", "Passenger", "Security", "Customs Officer", "Mechanic"] },
    { name: "Amusement Park", roles: ["Visitor", "Ride Operator", "Food Vendor", "Security", "Maintenance Worker"] },
    { name: "Art Gallery", roles: ["Visitor", "Artist", "Curator", "Security Guard", "Critic"] },
    { name: "Baseball Stadium", roles: ["Player", "Spectator", "Umpire", "Vendor", "Security"] },
    { name: "Broadway Theater", roles: ["Actor", "Audience Member", "Director", "Stagehand", "Critic"] },
    { name: "Cemetery", roles: ["Mourner", "Priest", "Funeral Director", "Gravedigger", "Tourist"] },
    { name: "Construction Site", roles: ["Engineer", "Construction Worker", "Architect", "Foreman", "Inspector"] },
    { name: "Cruise Ship", roles: ["Captain", "Passenger", "Bartender", "Entertainer", "Mechanic"] },
    { name: "Desert Island", roles: ["Castaway", "Explorer", "Pirate", "Native", "Archaeologist"] },
    { name: "Gas Station", roles: ["Cashier", "Customer", "Mechanic", "Truck Driver", "Manager"] },
    { name: "Jail", roles: ["Prisoner", "Guard", "Lawyer", "Warden", "Visitor"] },
    { name: "Library", roles: ["Librarian", "Student", "Researcher", "Author", "Visitor"] },
    { name: "Mall", roles: ["Shopper", "Security Guard", "Sales Clerk", "Food Court Worker", "Manager"] },
    { name: "Night Club", roles: ["DJ", "Bouncer", "Bartender", "Dancer", "Patron"] },
    { name: "Park", roles: ["Jogger", "Dog Walker", "Picnicker", "Park Ranger", "Photographer"] },
    { name: "Prison", roles: ["Inmate", "Guard", "Warden", "Lawyer", "Visitor"] },
    { name: "Race Track", roles: ["Driver", "Mechanic", "Spectator", "Commentator", "Security"] },
    { name: "Retirement Home", roles: ["Resident", "Nurse", "Visitor", "Doctor", "Activity Director"] },
    { name: "Rock Concert", roles: ["Singer", "Guitarist", "Drummer", "Fan", "Security"] },
    { name: "Ski Resort", roles: ["Skier", "Instructor", "Lift Operator", "Hotel Guest", "Ski Patroller"] },
    { name: "Subway", roles: ["Passenger", "Conductor", "Ticket Inspector", "Street Musician", "Homeless Person"] },
    { name: "Temple", roles: ["Monk", "Worshipper", "Tourist", "Guide", "Novice"] },
    { name: "UFO", roles: ["Alien", "Scientist", "Military Officer", "Abductee", "Engineer"] },
    { name: "Vineyard", roles: ["Winemaker", "Tourist", "Sommelier", "Farmer", "Guest"] },
    { name: "Wedding", roles: ["Bride", "Groom", "Priest", "Best Man", "Photographer"] },
    { name: "Zoo", roles: ["Zookeeper", "Visitor", "Veterinarian", "Tour Guide", "Security"] }
];

const COUNTRIES_PACK_FULL = [
    { name: "Russia", roles: ["Diplomat", "Intelligence Officer", "Businessman", "Journalist", "Embassy Staff"] },
    { name: "United States", roles: ["CIA Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"] },
    { name: "United Kingdom", roles: ["MI6 Agent", "Diplomat", "Businessman", "Journalist", "Embassy Staff"] },
    { name: "China", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] },
    { name: "Israel", roles: ["Mossad Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"] },
    { name: "Germany", roles: ["BND Agent", "Diplomat", "Business Executive", "Journalist", "Embassy Staff"] },
    { name: "France", roles: ["DGSE Agent", "Diplomat", "Businessman", "Cultural Attaché", "Embassy Staff"] },
    { name: "Japan", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] },
    { name: "Iran", roles: ["Intelligence Officer", "Diplomat", "Businessman", "Religious Scholar", "Embassy Staff"] },
    { name: "North Korea", roles: ["Intelligence Officer", "Diplomat", "Trade Representative", "Military Officer", "Embassy Staff"] },
    { name: "Turkey", roles: ["MIT Agent", "Diplomat", "Businessman", "Journalist", "Embassy Staff"] },
    { name: "India", roles: ["RAW Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"] },
    { name: "South Korea", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"] },
    { name: "Pakistan", roles: ["ISI Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"] },
    { name: "Saudi Arabia", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Religious Scholar", "Embassy Staff"] },
    { name: "Brazil", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] },
    { name: "Mexico", roles: ["Intelligence Officer", "Diplomat", "Businessman", "Trade Representative", "Embassy Staff"] },
    { name: "Canada", roles: ["CSIS Agent", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] },
    { name: "Australia", roles: ["ASIS Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"] },
    { name: "Italy", roles: ["AISE Agent", "Diplomat", "Businessman", "Cultural Attaché", "Embassy Staff"] },
    { name: "Spain", roles: ["CNI Agent", "Diplomat", "Business Executive", "Cultural Attaché", "Embassy Staff"] },
    { name: "Netherlands", roles: ["AIVD Agent", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] },
    { name: "Poland", roles: ["ABW Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"] },
    { name: "Czech Republic", roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"] }
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

// Get full location object with roles by name
function getLocationWithRoles(locationName, enabledPacks = ['pack1']) {
    let allLocations = [];
    
    if (enabledPacks.includes('pack1')) {
        allLocations = allLocations.concat(PACK1_LOCATIONS_FULL);
    }
    
    if (enabledPacks.includes('pack2')) {
        allLocations = allLocations.concat(PACK2_LOCATIONS_FULL);
    }
    
    if (enabledPacks.includes('countries')) {
        allLocations = allLocations.concat(COUNTRIES_PACK_FULL);
    }
    
    if (allLocations.length === 0) {
        allLocations = PACK1_LOCATIONS_FULL; // Fallback
    }
    
    return allLocations.find(loc => loc.name === locationName) || null;
}

// Get all enabled location names
function getAllEnabledLocationNames(enabledPacks = ['pack1']) {
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
    
    return allLocations;
}

module.exports = {
    PACK1_LOCATION_NAMES,
    PACK2_LOCATION_NAMES,
    COUNTRIES_PACK_NAMES,
    getRandomLocation,
    getLocationWithRoles,
    getAllEnabledLocationNames
};
