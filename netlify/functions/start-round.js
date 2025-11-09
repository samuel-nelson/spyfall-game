// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');
const { getRandomLocation } = require('./locations-data');

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

        // Allow starting new round if previous round ended or if no round exists
        // Only block if game is actively playing
        if (game.status === 'playing' && game.currentRound && Date.now() < game.currentRound.endTime) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game is already in progress' })
            };
        }

        // Get game settings (defaults if not set)
        const settings = game.settings || {};
        const spyCount = Math.max(1, Math.min(2, parseInt(settings.spyCount) || 1));
        const timerMinutes = Math.max(1, Math.min(60, parseInt(settings.timerMinutes) || 8));
        const enabledLocationSets = settings.enabledLocationSets || ['spyfall1'];
        const customLocations = settings.customLocations || [];
        const enabledLocationsList = settings.enabledLocationsList || null;

        // Select random spies (1 or 2)
        const spyIds = [];
        const availablePlayers = [...game.players];
        
        for (let i = 0; i < spyCount && availablePlayers.length > 0; i++) {
            const spyIndex = Math.floor(Math.random() * availablePlayers.length);
            spyIds.push(availablePlayers[spyIndex].id);
            availablePlayers.splice(spyIndex, 1);
        }

        // Select random location from enabled sets or individual locations
        const location = getRandomLocation(enabledLocationSets, customLocations, enabledLocationsList);

        // Determine starting player (random)
        const startingPlayerIndex = Math.floor(Math.random() * game.players.length);
        const currentTurn = game.players[startingPlayerIndex].id;

        // Calculate round number
        const roundNumber = (game.currentRound && game.currentRound.roundNumber) 
            ? game.currentRound.roundNumber + 1 
            : 1;

        // Start round with custom timer
        const roundDuration = timerMinutes * 60 * 1000;
        const endTime = Date.now() + roundDuration;

        game.currentRound = {
            roundNumber,
            location,
            spyId: spyIds.length === 1 ? spyIds[0] : null, // Backward compatibility
            spyIds: spyIds.length > 1 ? spyIds : null, // Multiple spies
            currentTurn,
            currentQuestion: null,
            waitingForAnswer: null,
            endTime,
            spyWon: false,
            accusation: null,
            spyGuessedLocation: null,
            votes: null,
            showSpyCount: settings.showSpyCount !== false // Default to true
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

