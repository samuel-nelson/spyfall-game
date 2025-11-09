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
        const { gameCode, playerId, targetId, question } = JSON.parse(event.body);

        if (!gameCode || !playerId || !targetId || !question) {
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

        // Verify target is in game
        const targetPlayer = game.players.find(p => p.id === targetId);
        if (!targetPlayer) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Target player not found' })
            };
        }

        const askerPlayer = game.players.find(p => p.id === playerId);

        // Set current question
        round.currentQuestion = {
            text: question.trim(),
            askerId: playerId,
            askerName: askerPlayer.name,
            answererId: targetId,
            answererName: targetPlayer.name
        };

        round.waitingForAnswer = targetId;

        // Save updated game
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
        console.error('Error asking question:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

