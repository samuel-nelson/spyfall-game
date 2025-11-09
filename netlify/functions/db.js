// Neon (PostgreSQL) connection module for Netlify
const { Pool } = require('pg');

// Get Neon database connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

let pool = null;

function getPool() {
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
    }
    
    if (!pool) {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    
    return pool;
}

// Initialize database schema (create table if it doesn't exist)
async function initializeSchema() {
    const pool = getPool();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS games (
            code VARCHAR(10) PRIMARY KEY,
            status VARCHAR(20) NOT NULL,
            players JSONB NOT NULL,
            current_round JSONB,
            created_at BIGINT NOT NULL
        )
    `);
    
    // Create index on code for faster lookups
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_games_code ON games(code)
    `);
    
    // Create index on created_at for cleanup
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at)
    `);
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
    const pool = getPool();
    
    try {
        const result = await pool.query(
            'SELECT code, status, players, current_round, created_at FROM games WHERE code = $1',
            [gameCode.toUpperCase()]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        return {
            code: row.code,
            status: row.status,
            players: row.players,
            currentRound: row.current_round,
            createdAt: row.created_at
        };
    } catch (error) {
        console.error('Error getting game:', error);
        throw error;
    }
}

async function saveGame(game) {
    await ensureSchema();
    const pool = getPool();
    const gameCode = game.code.toUpperCase();
    
    try {
        await pool.query(
            `INSERT INTO games (code, status, players, current_round, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (code) 
             DO UPDATE SET 
                 status = EXCLUDED.status,
                 players = EXCLUDED.players,
                 current_round = EXCLUDED.current_round`,
            [
                gameCode,
                game.status,
                JSON.stringify(game.players),
                game.currentRound ? JSON.stringify(game.currentRound) : null,
                game.createdAt || Date.now()
            ]
        );
    } catch (error) {
        console.error('Error saving game:', error);
        throw error;
    }
}

async function deleteGame(gameCode) {
    await ensureSchema();
    const pool = getPool();
    
    try {
        await pool.query(
            'DELETE FROM games WHERE code = $1',
            [gameCode.toUpperCase()]
        );
    } catch (error) {
        console.error('Error deleting game:', error);
        throw error;
    }
}

async function cleanupOldGames() {
    await ensureSchema();
    const pool = getPool();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffTime = Date.now() - maxAge;
    
    try {
        await pool.query(
            'DELETE FROM games WHERE created_at < $1',
            [cutoffTime]
        );
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
