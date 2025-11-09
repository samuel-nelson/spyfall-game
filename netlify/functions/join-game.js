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

        // Allow joining if game is in lobby, playing, or roundEnd (players can wait for next round)
        // Only block if game is in an invalid state
        if (game.status && game.status !== 'lobby' && game.status !== 'playing' && game.status !== 'roundEnd') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Game is not available to join' })
            };
        }

        const trimmedName = playerName.trim();
        const nameLower = trimmedName.toLowerCase();
        
        // Check if player with this name already exists (allow rejoin)
        const existingPlayer = game.players.find(p => p.name.toLowerCase() === nameLower);
        
        let playerId;
        if (existingPlayer) {
            // Player rejoining - reuse their player ID
            playerId = existingPlayer.id;
            // Update name in case it changed slightly (trimmed)
            existingPlayer.name = trimmedName;
        } else {
            // New player - check if name is taken by another player (case-insensitive)
            const nameTaken = game.players.some(p => p.name.toLowerCase() === nameLower);
            if (nameTaken) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Player name already taken in this game' })
                };
            }
            // Generate new player ID
            playerId = generatePlayerId();
            
            // Add new player to game
            game.players.push({
                id: playerId,
                name: trimmedName
            });
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

