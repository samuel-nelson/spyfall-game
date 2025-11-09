// Spyfall game locations
const LOCATIONS = [
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

// Get a random location
function getRandomLocation() {
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

// Get location by name
function getLocationByName(name) {
    return LOCATIONS.find(loc => loc.name === name);
}

