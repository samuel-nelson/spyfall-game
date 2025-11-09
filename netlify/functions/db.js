// Neon database connection using Netlify's official Neon package
const { neon } = require('@netlify/neon');

// Get Neon database connection - automatically uses NETLIFY_DATABASE_URL env variable
const sql = neon();

// Initialize database schema (create table if it doesn't exist)
async function initializeSchema() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS games (
                code VARCHAR(10) PRIMARY KEY,
                status VARCHAR(20) NOT NULL,
                players JSONB NOT NULL,
                current_round JSONB,
                settings JSONB,
                created_at BIGINT NOT NULL
            )
        `;
        
        // Add settings column if it doesn't exist (for existing tables)
        await sql`
            ALTER TABLE games 
            ADD COLUMN IF NOT EXISTS settings JSONB
        `;
        
        // Create index on code for faster lookups
        await sql`
            CREATE INDEX IF NOT EXISTS idx_games_code ON games(code)
        `;
        
        // Create index on created_at for cleanup
        await sql`
            CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at)
        `;
    } catch (error) {
        console.error('Error initializing schema:', error);
        throw error;
    }
}

// Initialize schema on first connection
let schemaInitialized = false;
async function ensureSchema() {
    if (!schemaInitialized) {
        await initializeSchema();
        schemaInitialized = true;
    }
}

// Game store functions using Neon PostgreSQL
async function getGame(gameCode) {
    await ensureSchema();
    
    try {
        const result = await sql`
            SELECT code, status, players, current_round, settings, created_at 
            FROM games 
            WHERE code = ${gameCode.toUpperCase()}
        `;
        
        if (result.length === 0) {
            return null;
        }
        
        const row = result[0];
        return {
            code: row.code,
            status: row.status,
            players: row.players,
            currentRound: row.current_round,
            settings: row.settings || null,
            createdAt: row.created_at
        };
    } catch (error) {
        console.error('Error getting game:', error);
        throw error;
    }
}

async function saveGame(game) {
    await ensureSchema();
    const gameCode = game.code.toUpperCase();
    const playersJson = JSON.stringify(game.players);
    const currentRoundJson = game.currentRound ? JSON.stringify(game.currentRound) : null;
    const settingsJson = game.settings ? JSON.stringify(game.settings) : null;
    const createdAt = game.createdAt || Date.now();
    
    try {
        // PostgreSQL automatically converts JSON strings to JSONB when inserting into JSONB columns
        if (currentRoundJson) {
            await sql`
                INSERT INTO games (code, status, players, current_round, settings, created_at)
                VALUES (${gameCode}, ${game.status}, ${playersJson}::jsonb, ${currentRoundJson}::jsonb, ${settingsJson}::jsonb, ${createdAt})
                ON CONFLICT (code) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    players = EXCLUDED.players,
                    current_round = EXCLUDED.current_round,
                    settings = EXCLUDED.settings
            `;
        } else {
            await sql`
                INSERT INTO games (code, status, players, current_round, settings, created_at)
                VALUES (${gameCode}, ${game.status}, ${playersJson}::jsonb, NULL, ${settingsJson}::jsonb, ${createdAt})
                ON CONFLICT (code) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    players = EXCLUDED.players,
                    current_round = EXCLUDED.current_round,
                    settings = EXCLUDED.settings
            `;
        }
    } catch (error) {
        console.error('Error saving game:', error);
        throw error;
    }
}

async function deleteGame(gameCode) {
    await ensureSchema();
    
    try {
        await sql`
            DELETE FROM games 
            WHERE code = ${gameCode.toUpperCase()}
        `;
    } catch (error) {
        console.error('Error deleting game:', error);
        throw error;
    }
}

async function cleanupOldGames() {
    await ensureSchema();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffTime = Date.now() - maxAge;
    
    try {
        await sql`
            DELETE FROM games 
            WHERE created_at < ${cutoffTime}
        `;
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
