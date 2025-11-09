// Import shared games store
const { games } = require('./game-store');

// Generate random game code
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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

        // Generate or use provided game code
        let finalGameCode = gameCode && gameCode.trim().length > 0 
            ? gameCode.trim().toUpperCase() 
            : generateGameCode();

        // Check if game code already exists
        if (games[finalGameCode]) {
            if (gameCode && gameCode.trim().length > 0) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Game code already exists' })
                };
            } else {
                // Generate a new one if random code collides
                while (games[finalGameCode]) {
                    finalGameCode = generateGameCode();
                }
            }
        }

        const playerId = generatePlayerId();

        // Create new game
        games[finalGameCode] = {
            code: finalGameCode,
            status: 'lobby',
            players: [{
                id: playerId,
                name: playerName.trim()
            }],
            createdAt: Date.now(),
            currentRound: null
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameCode: finalGameCode,
                playerId: playerId
            })
        };
    } catch (error) {
        console.error('Error creating game:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};


