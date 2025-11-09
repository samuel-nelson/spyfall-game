// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        const { playerName, gameCode } = JSON.parse(event.body);

        if (!playerName || playerName.trim().length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Player name is required' })
            };
        }

        if (!gameCode || gameCode.trim().length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game code is required' })
            };
        }

        const code = gameCode.trim().toUpperCase();
        const game = await getGameByCode(code);

        if (!game) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game not found' })
            };
        }

        if (game.status !== 'lobby') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game has already started' })
            };
        }

        // Check if player name already exists
        if (game.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Player name already taken in this game' })
            };
        }

        const playerId = generatePlayerId();

        // Add player to game
        game.players.push({
            id: playerId,
            name: playerName.trim()
        });

        // Save updated game
        await saveGameState(game);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerId: playerId
            })
        };
    } catch (error) {
        console.error('Error joining game:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

