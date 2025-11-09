// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');

// Get random location
const LOCATIONS = [
    "Airplane", "Bank", "Beach", "Casino", "Cathedral", "Circus Tent",
    "Corporate Party", "Crusader Army", "Day Spa", "Embassy", "Hospital",
    "Hotel", "Military Base", "Movie Studio", "Ocean Liner", "Passenger Train",
    "Pirate Ship", "Polar Station", "Police Station", "Restaurant", "School",
    "Service Station", "Space Station", "Submarine", "Supermarket", "Theater",
    "University", "World War II Squad"
];

function getRandomLocation() {
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

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
        const { gameCode, playerId } = JSON.parse(event.body);

        if (!gameCode || !playerId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game code and player ID are required' })
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

        // Check if player is host (first player)
        if (game.players.length === 0 || game.players[0].id !== playerId) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Only the host can start the game' })
            };
        }

        if (game.players.length < 3) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Need at least 3 players to start' })
            };
        }

        // Allow starting new round even if previous round ended
        if (game.status === 'playing' && game.currentRound) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game is already in progress' })
            };
        }

        // Select random spy
        const spyIndex = Math.floor(Math.random() * game.players.length);
        const spyId = game.players[spyIndex].id;

        // Select random location
        const location = getRandomLocation();

        // Determine starting player (random)
        const startingPlayerIndex = Math.floor(Math.random() * game.players.length);
        const currentTurn = game.players[startingPlayerIndex].id;

        // Calculate round number
        const roundNumber = (game.currentRound && game.currentRound.roundNumber) 
            ? game.currentRound.roundNumber + 1 
            : 1;

        // Start round (8 minutes = 480000 ms)
        const roundDuration = 8 * 60 * 1000;
        const endTime = Date.now() + roundDuration;

        game.currentRound = {
            roundNumber,
            location,
            spyId,
            currentTurn,
            currentQuestion: null,
            waitingForAnswer: null,
            endTime,
            spyWon: false,
            accusation: null,
            spyGuessedLocation: null,
            votes: null
        };

        game.status = 'playing';

        // Save game to database
        await saveGameState(game);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('Error starting round:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

