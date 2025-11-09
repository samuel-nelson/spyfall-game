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
        const { gameCode, playerId } = JSON.parse(event.body);

        if (!gameCode || !playerId) {
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

        // Remove player from game
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Player not found in game' })
            };
        }

        // If player is the host (first player), transfer host to next player or end game
        const wasHost = playerIndex === 0;
        game.players.splice(playerIndex, 1);

        // If no players left, delete the game
        if (game.players.length === 0) {
            const { removeGame } = require('./game-store');
            await removeGame(game.code);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ success: true, gameDeleted: true })
            };
        }

        // If leaving player was host and game is in lobby, transfer host (first player becomes new host automatically)
        // If game is playing, we can't transfer host easily, so just remove the player

        // If game was in progress and player was spy, need to handle that
        if (game.status === 'playing' && game.currentRound) {
            const round = game.currentRound;
            
            // If leaving player was a spy, check if there are other spies
            if (Array.isArray(round.spyIds)) {
                const spyIndex = round.spyIds.indexOf(playerId);
                if (spyIndex !== -1) {
                    round.spyIds.splice(spyIndex, 1);
                    // If no spies left, end the round
                    if (round.spyIds.length === 0) {
                        game.status = 'roundEnd';
                        round.spyWon = false;
                    }
                }
            } else if (round.spyId === playerId) {
                // Single spy left - end round
                game.status = 'roundEnd';
                round.spyWon = false;
            }
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
                wasHost: wasHost,
                playersRemaining: game.players.length
            })
        };
    } catch (error) {
        console.error('Error leaving game:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

