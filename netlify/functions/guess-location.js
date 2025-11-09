// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');

// Get all locations
const LOCATIONS = [
    "Airplane", "Bank", "Beach", "Casino", "Cathedral", "Circus Tent",
    "Corporate Party", "Crusader Army", "Day Spa", "Embassy", "Hospital",
    "Hotel", "Military Base", "Movie Studio", "Ocean Liner", "Passenger Train",
    "Pirate Ship", "Polar Station", "Police Station", "Restaurant", "School",
    "Service Station", "Space Station", "Submarine", "Supermarket", "Theater",
    "University", "World War II Squad"
];

exports.handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { gameCode, playerId, guessedLocation } = JSON.parse(event.body);

        if (!gameCode || !playerId || !guessedLocation) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const game = await getGameByCode(gameCode.toUpperCase());

        if (!game) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game not found' })
            };
        }

        if (game.status !== 'playing' || !game.currentRound) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game is not in progress' })
            };
        }

        const round = game.currentRound;

        // Only spy can guess location
        if (round.spyId !== playerId) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Only the spy can guess the location' })
            };
        }

        // Check if guess is correct
        const isCorrect = guessedLocation.trim().toLowerCase() === round.location.toLowerCase();
        
        if (isCorrect) {
            // Spy wins!
            game.status = 'roundEnd';
            round.spyWon = true;
            round.spyGuessedLocation = guessedLocation.trim();
            // Save updated game
            await saveGameState(game);
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true,
                isCorrect: isCorrect
            })
        };
    } catch (error) {
        console.error('Error guessing location:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

