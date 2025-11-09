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
        const moleCount = Math.max(1, Math.min(2, parseInt(settings.moleCount || settings.spyCount) || 1));
        const timerMinutes = Math.max(1, Math.min(60, parseInt(settings.timerMinutes) || 8));
        const enabledPacks = settings.enabledPacks || ['pack1'];

        // Select random moles (1 or 2)
        const moleIds = [];
        const availablePlayers = [...game.players];
        
        for (let i = 0; i < moleCount && availablePlayers.length > 0; i++) {
            const moleIndex = Math.floor(Math.random() * availablePlayers.length);
            moleIds.push(availablePlayers[moleIndex].id);
            availablePlayers.splice(moleIndex, 1);
        }

        // Select random location from enabled packs
        const location = getRandomLocation(enabledPacks);

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
            moleId: moleIds.length === 1 ? moleIds[0] : null, // New naming
            moleIds: moleIds.length > 1 ? moleIds : (moleIds.length === 1 ? moleIds : null), // New naming
            spyId: moleIds.length === 1 ? moleIds[0] : null, // Legacy support
            spyIds: moleIds.length > 1 ? moleIds : null, // Legacy support
            currentTurn,
            currentQuestion: null,
            waitingForAnswer: null,
            endTime,
            moleWon: false,
            spyWon: false, // Legacy support
            accusation: null,
            moleGuessedLocation: null,
            spyGuessedLocation: null, // Legacy support
            votes: null,
            showMoleCount: (settings.showMoleCount !== false && settings.showSpyCount !== false), // Default to true
            showSpyCount: (settings.showMoleCount !== false && settings.showSpyCount !== false) // Legacy support
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

