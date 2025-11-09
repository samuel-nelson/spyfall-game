// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');

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
        const { gameCode, playerId, settings } = JSON.parse(event.body);

        if (!gameCode || !playerId || !settings) {
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

        // Only host can update settings
        const isHost = game.players[0] && game.players[0].id === playerId;
        if (!isHost) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Only the host can update game settings' })
            };
        }

        // Can't update settings if game is in progress
        if (game.status === 'playing') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Cannot update settings during an active game' })
            };
        }

        // Initialize settings if not exists
        if (!game.settings) {
            game.settings = {};
        }

        // Update settings (support both mole and legacy spy naming)
        if (settings.moleCount !== undefined) {
            game.settings.moleCount = Math.max(1, Math.min(2, parseInt(settings.moleCount) || 1));
            game.settings.spyCount = game.settings.moleCount; // Legacy support
        } else if (settings.spyCount !== undefined) {
            game.settings.spyCount = Math.max(1, Math.min(2, parseInt(settings.spyCount) || 1));
            game.settings.moleCount = game.settings.spyCount; // New naming
        }
        if (settings.showMoleCount !== undefined) {
            game.settings.showMoleCount = Boolean(settings.showMoleCount);
            game.settings.showSpyCount = game.settings.showMoleCount; // Legacy support
        } else if (settings.showSpyCount !== undefined) {
            game.settings.showSpyCount = Boolean(settings.showSpyCount);
            game.settings.showMoleCount = game.settings.showSpyCount; // New naming
        }
        if (settings.timerMinutes !== undefined) {
            game.settings.timerMinutes = Math.max(1, Math.min(60, parseInt(settings.timerMinutes) || 8));
        }
        if (settings.enabledPacks !== undefined) {
            // Store enabled packs (pack1, pack2, countries)
            game.settings.enabledPacks = Array.isArray(settings.enabledPacks) && settings.enabledPacks.length > 0 
                ? settings.enabledPacks 
                : ['pack1'];
        }

        // Save updated game
        await saveGameState(game);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true,
                settings: game.settings
            })
        };
    } catch (error) {
        console.error('Error updating game settings:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

