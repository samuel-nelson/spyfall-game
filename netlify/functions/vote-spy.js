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
        const isSpy = round.spyId === playerId;

        // Only non-spies can vote
        if (isSpy) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'The spy cannot vote' })
            };
        }

        // Initialize votes if not exists
        if (!round.votes) {
            round.votes = {};
        }

        // Record vote
        round.votes[playerId] = accusedId;

        // Count votes for each player
        const voteCounts = {};
        const nonSpyPlayers = game.players.filter(p => p.id !== round.spyId);
        
        Object.values(round.votes).forEach(votedPlayerId => {
            voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
        });

        // Check if majority has voted for someone (more than 50% of non-spies)
        const majorityThreshold = Math.ceil(nonSpyPlayers.length / 2);
        let majorityAccused = null;
        
        for (const [accusedId, count] of Object.entries(voteCounts)) {
            if (count > majorityThreshold) {
                majorityAccused = accusedId;
                break;
            }
        }

        // If majority reached, end the round
        if (majorityAccused) {
            const accusedPlayer = game.players.find(p => p.id === majorityAccused);
            const wasCorrect = majorityAccused === round.spyId;

            round.accusation = {
                type: 'vote',
                accusedId: majorityAccused,
                accusedName: accusedPlayer.name,
                votes: round.votes,
                voteCounts: voteCounts
            };

            game.status = 'roundEnd';
            round.spyWon = !wasCorrect;

            await saveGameState(game);

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: true,
                    majorityReached: true,
                    wasCorrect: wasCorrect,
                    accusedId: majorityAccused
                })
            };
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
                majorityReached: false,
                votes: round.votes,
                voteCounts: voteCounts
            })
        };
    } catch (error) {
        console.error('Error voting for spy:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

