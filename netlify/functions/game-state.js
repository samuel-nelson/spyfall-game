// Import database functions
const { getGameByCode } = require('./game-store');

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
                playerRoles: game.currentRound.playerRoles || {}, // Include player roles
                moleId: game.currentRound.moleId || game.currentRound.spyId, // New naming
                moleIds: Array.isArray(game.currentRound.moleIds) ? game.currentRound.moleIds : (Array.isArray(game.currentRound.spyIds) ? game.currentRound.spyIds : (game.currentRound.moleId || game.currentRound.spyId ? [game.currentRound.moleId || game.currentRound.spyId] : null)),
                spyId: game.currentRound.spyId || game.currentRound.moleId, // Legacy support
                spyIds: Array.isArray(game.currentRound.spyIds) ? game.currentRound.spyIds : (Array.isArray(game.currentRound.moleIds) ? game.currentRound.moleIds : (game.currentRound.spyId || game.currentRound.moleId ? [game.currentRound.spyId || game.currentRound.moleId] : null)),
                currentTurn: game.currentRound.currentTurn,
                currentQuestion: game.currentRound.currentQuestion,
                waitingForAnswer: game.currentRound.waitingForAnswer,
                endTime: game.currentRound.endTime,
                moleWon: game.currentRound.moleWon !== undefined ? game.currentRound.moleWon : game.currentRound.spyWon,
                spyWon: game.currentRound.spyWon !== undefined ? game.currentRound.spyWon : game.currentRound.moleWon, // Legacy support
                accusation: game.currentRound.accusation,
                moleGuessedLocation: game.currentRound.moleGuessedLocation || game.currentRound.spyGuessedLocation,
                spyGuessedLocation: game.currentRound.spyGuessedLocation || game.currentRound.moleGuessedLocation, // Legacy support
                votes: game.currentRound.votes
            } : null,
            settings: game.settings || null
        };

        // If player is mole, don't reveal location (support both single and multiple moles, and legacy spy references)
        if (gameState.currentRound && playerId) {
            const moleIds = Array.isArray(game.currentRound.moleIds) ? game.currentRound.moleIds : (Array.isArray(game.currentRound.spyIds) ? game.currentRound.spyIds : [game.currentRound.moleId || game.currentRound.spyId]);
            const isMole = moleIds.includes(playerId);
            if (isMole) {
                gameState.currentRound.location = null;
            }
        }
        
        // Include moleIds in response for frontend
        if (gameState.currentRound && game.currentRound) {
            const moleIds = Array.isArray(game.currentRound.moleIds) ? game.currentRound.moleIds : (Array.isArray(game.currentRound.spyIds) ? game.currentRound.spyIds : (game.currentRound.moleId || game.currentRound.spyId ? [game.currentRound.moleId || game.currentRound.spyId] : []));
            gameState.currentRound.moleIds = moleIds.length > 0 ? moleIds : null;
            gameState.currentRound.spyIds = moleIds.length > 0 ? moleIds : null; // Legacy support
        }

        // Check if round time has expired
        if (gameState.currentRound && gameState.currentRound.endTime) {
            const now = Date.now();
            if (now >= gameState.currentRound.endTime && game.status === 'playing') {
                // Time's up - end the round
                game.status = 'roundEnd';
                gameState.status = 'roundEnd';
                // Mole wins if time runs out without accusation
                if (!game.currentRound.accusation) {
                    game.currentRound.moleWon = true;
                    game.currentRound.spyWon = true; // Legacy support
                    gameState.currentRound.moleWon = true;
                    gameState.currentRound.spyWon = true; // Legacy support
                }
                // Save updated game state
                const { saveGameState } = require('./game-store');
                await saveGameState(game);
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

