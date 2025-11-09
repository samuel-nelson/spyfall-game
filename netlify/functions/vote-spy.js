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
        
        // Check if player is a mole (support both single and multiple moles, and legacy spy references)
        const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
        const isMole = moleIds.includes(playerId);

        // Only non-moles can vote
        if (isMole) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'The mole cannot vote' })
            };
        }

        // Initialize votes if not exists
        if (!round.votes) {
            round.votes = {};
        }

        // Record vote (allow players to change their vote)
        round.votes[playerId] = accusedId;

        // Count votes for each player
        const voteCounts = {};
        // Get all mole IDs (support both single and multiple moles, and legacy spy references)
        const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
        const nonMolePlayers = game.players.filter(p => !moleIds.includes(p.id));
        
        Object.values(round.votes).forEach(votedPlayerId => {
            voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
        });

        // Check if majority has voted for someone (more than 50% of non-moles)
        const majorityThreshold = Math.ceil(nonMolePlayers.length / 2);
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
            const wasCorrect = moleIds.includes(majorityAccused);

            round.accusation = {
                type: 'vote',
                accusedId: majorityAccused,
                accusedName: accusedPlayer.name,
                votes: round.votes,
                voteCounts: voteCounts
            };

            game.status = 'roundEnd';
            round.moleWon = !wasCorrect;
            round.spyWon = !wasCorrect; // Legacy support

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
        console.error('Error voting for mole:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

