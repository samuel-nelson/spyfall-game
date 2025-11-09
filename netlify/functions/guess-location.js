// Import database functions
const { getGameByCode, saveGameState } = require('./game-store');

// Get all locations
const LOCATIONS = [
    "Airplane", "Bank", "Beach", "Casino", "Cathedral", "Circus Tent",
    "Corporate Party", "Crusader Army", "Day Spa", "Embassy", "Hospital",
    "Hotel", "Military Base", "Movie Studio", "Ocean Liner", "Passenger Train",
    "Pirate Ship", "Polar Station", "Police Station", "Restaurant", "School",
    "Service Station", "Space Station", "Submarine", "Supermarket", "Theater",
    "University", "World War II Squad"
];

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
        const { gameCode, playerId, guessedLocation } = JSON.parse(event.body);

        if (!gameCode || !playerId || !guessedLocation) {
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
        
        // Only mole can guess location
        if (!isMole) {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Only the mole can guess the location' })
            };
        }

        // Check if mole has already guessed (only one chance)
        const hasGuessed = (round.moleGuessedLocation || round.spyGuessedLocation) !== null && (round.moleGuessedLocation || round.spyGuessedLocation) !== undefined;
        if (hasGuessed) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'You have already made your guess. Only one guess is allowed per round.' })
            };
        }

        // Check if guess is correct
        // Handle both string and object location formats
        const locationName = typeof round.location === 'string' ? round.location : round.location?.name || round.location;
        const guessedName = guessedLocation.trim();
        const isCorrect = guessedName.toLowerCase() === locationName.toLowerCase();
        
        // Record the guess (whether correct or not)
        round.moleGuessedLocation = guessedLocation.trim();
        round.spyGuessedLocation = guessedLocation.trim(); // Legacy support
        
        if (isCorrect) {
            // Mole wins!
            game.status = 'roundEnd';
            round.moleWon = true;
            round.spyWon = true; // Legacy support
        } else {
            // Mole loses - wrong guess ends the round
            game.status = 'roundEnd';
            round.moleWon = false;
            round.spyWon = false; // Legacy support
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
                isCorrect: isCorrect
            })
        };
    } catch (error) {
        console.error('Error guessing location:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

