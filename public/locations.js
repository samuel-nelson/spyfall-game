// The Operative game locations - organized by pack
// Pack 1 locations (original set)
const PACK1_LOCATIONS = [
    {
        name: "Airplane",
        roles: ["Pilot", "Passenger", "Flight Attendant", "Mechanic", "Air Marshal"]
    },
    {
        name: "Bank",
        roles: ["Teller", "Customer", "Security Guard", "Manager", "Robber"]
    },
    {
        name: "Beach",
        roles: ["Lifeguard", "Swimmer", "Beach Goer", "Ice Cream Vendor", "Photographer"]
    },
    {
        name: "Casino",
        roles: ["Dealer", "Gambler", "Security", "Bartender", "Manager"]
    },
    {
        name: "Cathedral",
        roles: ["Priest", "Worshipper", "Tourist", "Choir Member", "Janitor"]
    },
    {
        name: "Circus Tent",
        roles: ["Clown", "Acrobat", "Juggler", "Ringmaster", "Spectator"]
    },
    {
        name: "Corporate Party",
        roles: ["Manager", "Employee", "Intern", "CEO", "Entertainer"]
    },
    {
        name: "Crusader Army",
        roles: ["Knight", "Archer", "Monk", "Servant", "Spy"]
    },
    {
        name: "Day Spa",
        roles: ["Client", "Masseuse", "Receptionist", "Stylist", "Masseur"]
    },
    {
        name: "Embassy",
        roles: ["Ambassador", "Diplomat", "Security", "Government Official", "Refugee"]
    },
    {
        name: "Hospital",
        roles: ["Doctor", "Nurse", "Patient", "Surgeon", "Visitor"]
    },
    {
        name: "Hotel",
        roles: ["Guest", "Receptionist", "Bellhop", "Maid", "Manager"]
    },
    {
        name: "Military Base",
        roles: ["Soldier", "Officer", "Medic", "Engineer", "Spy"]
    },
    {
        name: "Movie Studio",
        roles: ["Director", "Actor", "Cameraman", "Stuntman", "Costume Designer"]
    },
    {
        name: "Ocean Liner",
        roles: ["Captain", "Passenger", "Bartender", "Mechanic", "Rich Passenger"]
    },
    {
        name: "Passenger Train",
        roles: ["Mechanic", "Passenger", "Conductor", "Restaurant Chef", "Border Patrol"]
    },
    {
        name: "Pirate Ship",
        roles: ["Captain", "Sailor", "Cook", "Slave", "Cannoneer"]
    },
    {
        name: "Polar Station",
        roles: ["Scientist", "Explorer", "Medic", "Geologist", "Meteorologist"]
    },
    {
        name: "Police Station",
        roles: ["Criminal", "Detective", "Journalist", "Lawyer", "Police Officer"]
    },
    {
        name: "Restaurant",
        roles: ["Waiter", "Customer", "Chef", "Critic", "Owner"]
    },
    {
        name: "School",
        roles: ["Teacher", "Student", "Principal", "Janitor", "Parent"]
    },
    {
        name: "Service Station",
        roles: ["Manager", "Tire Specialist", "Biker", "Car Owner", "Mechanic"]
    },
    {
        name: "Space Station",
        roles: ["Engineer", "Alien", "Pilot", "Commander", "Scientist"]
    },
    {
        name: "Submarine",
        roles: ["Captain", "Sailor", "Cook", "Radioman", "Mechanic"]
    },
    {
        name: "Supermarket",
        roles: ["Customer", "Cashier", "Butcher", "Janitor", "Security Guard"]
    },
    {
        name: "Theater",
        roles: ["Actor", "Audience Member", "Coat Check Lady", "Director", "Prompter"]
    },
    {
        name: "University",
        roles: ["Graduate Student", "Professor", "Dean", "Student", "Janitor"]
    },
    {
        name: "World War II Squad",
        roles: ["Soldier", "Medic", "Radioman", "Sniper", "Officer"]
    }
];

// Pack 2 locations (second set)
const PACK2_LOCATIONS = [
    {
        name: "Airport",
        roles: ["Pilot", "Passenger", "Security", "Customs Officer", "Mechanic"]
    },
    {
        name: "Amusement Park",
        roles: ["Visitor", "Ride Operator", "Food Vendor", "Security", "Maintenance Worker"]
    },
    {
        name: "Art Gallery",
        roles: ["Visitor", "Artist", "Curator", "Security Guard", "Critic"]
    },
    {
        name: "Baseball Stadium",
        roles: ["Player", "Spectator", "Umpire", "Vendor", "Security"]
    },
    {
        name: "Broadway Theater",
        roles: ["Actor", "Audience Member", "Director", "Stagehand", "Critic"]
    },
    {
        name: "Cemetery",
        roles: ["Mourner", "Priest", "Funeral Director", "Gravedigger", "Tourist"]
    },
    {
        name: "Construction Site",
        roles: ["Engineer", "Construction Worker", "Architect", "Foreman", "Inspector"]
    },
    {
        name: "Cruise Ship",
        roles: ["Captain", "Passenger", "Bartender", "Entertainer", "Mechanic"]
    },
    {
        name: "Desert Island",
        roles: ["Castaway", "Explorer", "Pirate", "Native", "Archaeologist"]
    },
    {
        name: "Gas Station",
        roles: ["Cashier", "Customer", "Mechanic", "Truck Driver", "Manager"]
    },
    {
        name: "Jail",
        roles: ["Prisoner", "Guard", "Lawyer", "Warden", "Visitor"]
    },
    {
        name: "Library",
        roles: ["Librarian", "Student", "Researcher", "Author", "Visitor"]
    },
    {
        name: "Mall",
        roles: ["Shopper", "Security Guard", "Sales Clerk", "Food Court Worker", "Manager"]
    },
    {
        name: "Night Club",
        roles: ["DJ", "Bouncer", "Bartender", "Dancer", "Patron"]
    },
    {
        name: "Park",
        roles: ["Jogger", "Dog Walker", "Picnicker", "Park Ranger", "Photographer"]
    },
    {
        name: "Prison",
        roles: ["Inmate", "Guard", "Warden", "Lawyer", "Visitor"]
    },
    {
        name: "Race Track",
        roles: ["Driver", "Mechanic", "Spectator", "Commentator", "Security"]
    },
    {
        name: "Retirement Home",
        roles: ["Resident", "Nurse", "Visitor", "Doctor", "Activity Director"]
    },
    {
        name: "Rock Concert",
        roles: ["Singer", "Guitarist", "Drummer", "Fan", "Security"]
    },
    {
        name: "Ski Resort",
        roles: ["Skier", "Instructor", "Lift Operator", "Hotel Guest", "Ski Patroller"]
    },
    {
        name: "Subway",
        roles: ["Passenger", "Conductor", "Ticket Inspector", "Street Musician", "Homeless Person"]
    },
    {
        name: "Temple",
        roles: ["Monk", "Worshipper", "Tourist", "Guide", "Novice"]
    },
    {
        name: "UFO",
        roles: ["Alien", "Scientist", "Military Officer", "Abductee", "Engineer"]
    },
    {
        name: "Vineyard",
        roles: ["Winemaker", "Tourist", "Sommelier", "Farmer", "Guest"]
    },
    {
        name: "Wedding",
        roles: ["Bride", "Groom", "Priest", "Best Man", "Photographer"]
    },
    {
        name: "Zoo",
        roles: ["Zookeeper", "Visitor", "Veterinarian", "Tour Guide", "Security"]
    }
];

// Countries Pack - Locations in countries known for espionage
const COUNTRIES_PACK = [
    {
        name: "Russia",
        roles: ["Diplomat", "Intelligence Officer", "Businessman", "Journalist", "Embassy Staff"]
    },
    {
        name: "United States",
        roles: ["CIA Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"]
    },
    {
        name: "United Kingdom",
        roles: ["MI6 Agent", "Diplomat", "Businessman", "Journalist", "Embassy Staff"]
    },
    {
        name: "China",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Israel",
        roles: ["Mossad Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Germany",
        roles: ["BND Agent", "Diplomat", "Business Executive", "Journalist", "Embassy Staff"]
    },
    {
        name: "France",
        roles: ["DGSE Agent", "Diplomat", "Businessman", "Cultural Attaché", "Embassy Staff"]
    },
    {
        name: "Japan",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Iran",
        roles: ["Intelligence Officer", "Diplomat", "Businessman", "Religious Scholar", "Embassy Staff"]
    },
    {
        name: "North Korea",
        roles: ["Intelligence Officer", "Diplomat", "Trade Representative", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Turkey",
        roles: ["MIT Agent", "Diplomat", "Businessman", "Journalist", "Embassy Staff"]
    },
    {
        name: "India",
        roles: ["RAW Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"]
    },
    {
        name: "South Korea",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Pakistan",
        roles: ["ISI Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Saudi Arabia",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Religious Scholar", "Embassy Staff"]
    },
    {
        name: "Brazil",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Mexico",
        roles: ["Intelligence Officer", "Diplomat", "Businessman", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Canada",
        roles: ["CSIS Agent", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Australia",
        roles: ["ASIS Agent", "Diplomat", "Business Executive", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Italy",
        roles: ["AISE Agent", "Diplomat", "Businessman", "Cultural Attaché", "Embassy Staff"]
    },
    {
        name: "Spain",
        roles: ["CNI Agent", "Diplomat", "Business Executive", "Cultural Attaché", "Embassy Staff"]
    },
    {
        name: "Netherlands",
        roles: ["AIVD Agent", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    },
    {
        name: "Poland",
        roles: ["ABW Agent", "Diplomat", "Businessman", "Military Officer", "Embassy Staff"]
    },
    {
        name: "Czech Republic",
        roles: ["Intelligence Officer", "Diplomat", "Business Executive", "Trade Representative", "Embassy Staff"]
    }
];

// Legacy support - maintain old variable names for backward compatibility
const SPYFALL1_LOCATIONS = PACK1_LOCATIONS;
const SPYFALL2_LOCATIONS = PACK2_LOCATIONS;

// Get all locations from enabled packs
function getAllEnabledLocations(enabledPacks = ['pack1']) {
    let locations = [];
    
    if (enabledPacks.includes('pack1')) {
        locations = locations.concat(PACK1_LOCATIONS);
    }
    
    if (enabledPacks.includes('pack2')) {
        locations = locations.concat(PACK2_LOCATIONS);
    }
    
    if (enabledPacks.includes('countries')) {
        locations = locations.concat(COUNTRIES_PACK);
    }
    
    return locations;
}

// Get a random location from enabled packs
function getRandomLocation(enabledPacks = ['pack1']) {
    const allLocations = getAllEnabledLocations(enabledPacks);
    if (allLocations.length === 0) {
        // Fallback to Pack 1 if no packs enabled
        return PACK1_LOCATIONS[Math.floor(Math.random() * PACK1_LOCATIONS.length)];
    }
    return allLocations[Math.floor(Math.random() * allLocations.length)];
}

// Get location by name
function getLocationByName(name, enabledPacks = ['pack1']) {
    const allLocations = getAllEnabledLocations(enabledPacks);
    return allLocations.find(loc => loc.name === name);
}
