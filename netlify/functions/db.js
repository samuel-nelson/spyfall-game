// FaunaDB connection module for Netlify
const faunadb = require('faunadb');
const q = faunadb.query;

// Get FaunaDB secret from environment variable
const FAUNA_SECRET = process.env.FAUNA_SECRET || process.env.FAUNADB_SECRET_KEY;

let client = null;

function getClient() {
    if (!FAUNA_SECRET) {
        throw new Error('FAUNA_SECRET or FAUNADB_SECRET_KEY environment variable is required');
    }
    
    if (!client) {
        client = new faunadb.Client({ secret: FAUNA_SECRET });
    }
    
    return client;
}

// Game store functions using FaunaDB
async function getGame(gameCode) {
    try {
        const client = getClient();
        const result = await client.query(
            q.Get(q.Match(q.Index('games_by_code'), gameCode.toUpperCase()))
        );
        return result.data;
    } catch (error) {
        if (error.name === 'NotFound') {
            return null;
        }
        throw error;
    }
}

async function saveGame(game) {
    const client = getClient();
    const gameCode = game.code.toUpperCase();
    
    try {
        // Try to get existing game
        const existing = await client.query(
            q.Get(q.Match(q.Index('games_by_code'), gameCode))
        );
        
        // Update existing game
        await client.query(
            q.Update(existing.ref, {
                data: game
            })
        );
    } catch (error) {
        if (error.name === 'NotFound') {
            // Create new game
            await client.query(
                q.Create(q.Collection('games'), {
                    data: game
                })
            );
        } else {
            throw error;
        }
    }
}

async function deleteGame(gameCode) {
    try {
        const client = getClient();
        const existing = await client.query(
            q.Get(q.Match(q.Index('games_by_code'), gameCode.toUpperCase()))
        );
        await client.query(q.Delete(existing.ref));
    } catch (error) {
        if (error.name === 'NotFound') {
            // Game doesn't exist, nothing to delete
            return;
        }
        throw error;
    }
}

async function cleanupOldGames() {
    const client = getClient();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffTime = Date.now() - maxAge;
    
    try {
        // Get all games
        const allGames = await client.query(
            q.Paginate(q.Documents(q.Collection('games')))
        );
        
        // Filter and delete old games
        for (const gameRef of allGames.data) {
            try {
                const game = await client.query(q.Get(gameRef));
                if (game.data.createdAt && game.data.createdAt < cutoffTime) {
                    await client.query(q.Delete(gameRef));
                }
            } catch (error) {
                // Skip if game was already deleted
                console.error('Error deleting game:', error);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old games:', error);
        // Don't throw - cleanup is not critical
    }
}

module.exports = {
    getGame,
    saveGame,
    deleteGame,
    cleanupOldGames
};
