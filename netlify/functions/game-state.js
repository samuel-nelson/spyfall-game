// Import shared games store
const { games } = require('./game-store');

// Get random location (simplified - in production, load from locations.js)
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const gameCode = event.queryStringParameters?.gameCode;
        const playerId = event.queryStringParameters?.playerId;

        if (!gameCode) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game code is required' })
            };
        }

        const game = games[gameCode.toUpperCase()];

        if (!game) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game not found' })
            };
        }

        // Verify player is in game
        if (playerId && !game.players.some(p => p.id === playerId)) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Player not in game' })
            };
        }

        // Create a sanitized version of the game state
        const gameState = {
            code: game.code,
            status: game.status,
            players: game.players,
            currentRound: game.currentRound ? {
                roundNumber: game.currentRound.roundNumber,
                location: game.currentRound.location,
                spyId: game.currentRound.spyId,
                currentTurn: game.currentRound.currentTurn,
                currentQuestion: game.currentRound.currentQuestion,
                waitingForAnswer: game.currentRound.waitingForAnswer,
                endTime: game.currentRound.endTime,
            spyWon: game.currentRound.spyWon,
            accusation: game.currentRound.accusation,
            spyGuessedLocation: game.currentRound.spyGuessedLocation
        } : null
        };

        // If player is spy, don't reveal location
        if (gameState.currentRound && playerId) {
            const isSpy = gameState.currentRound.spyId === playerId;
            if (isSpy) {
                gameState.currentRound.location = null;
            }
        }

        // Check if round time has expired
        if (gameState.currentRound && gameState.currentRound.endTime) {
            const now = Date.now();
            if (now >= gameState.currentRound.endTime && game.status === 'playing') {
                // Time's up - end the round
                game.status = 'roundEnd';
                gameState.status = 'roundEnd';
                // Spy wins if time runs out without accusation
                if (!game.currentRound.accusation) {
                    game.currentRound.spyWon = true;
                    gameState.currentRound.spyWon = true;
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ game: gameState })
        };
    } catch (error) {
        console.error('Error fetching game state:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

