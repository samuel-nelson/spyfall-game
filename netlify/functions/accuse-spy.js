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
        const { gameCode, playerId, accusedId } = JSON.parse(event.body);

        if (!gameCode || !playerId || !accusedId) {
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

        if (round.currentTurn !== playerId) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Not your turn' })
            };
        }

        if (round.waitingForAnswer) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Waiting for answer to previous question' })
            };
        }

        // Verify accused is in game
        const accusedPlayer = game.players.find(p => p.id === accusedId);
        if (!accusedPlayer) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Accused player not found' })
            };
        }

        const accuserPlayer = game.players.find(p => p.id === playerId);

        // Record accusation
        round.accusation = {
            accuserId: playerId,
            accuserName: accuserPlayer.name,
            accusedId: accusedId,
            accusedName: accusedPlayer.name
        };

        // Check if accusation is correct (support both single and multiple spies)
        const spyIds = Array.isArray(round.spyIds) ? round.spyIds : (round.spyId ? [round.spyId] : []);
        const wasCorrect = spyIds.includes(accusedId);
        
        // End the round
        game.status = 'roundEnd';
        round.spyWon = !wasCorrect;
        
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
                wasCorrect: wasCorrect
            })
        };
    } catch (error) {
        console.error('Error accusing spy:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

