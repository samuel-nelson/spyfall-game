// Game store using MongoDB for persistent storage
// This allows games to be shared across different Netlify Function invocations
const { getGame, saveGame, deleteGame, cleanupOldGames } = require('./db');

// Wrapper functions to maintain compatibility with existing code
async function getGameByCode(gameCode) {
    return await getGame(gameCode);
}

async function saveGameState(game) {
    return await saveGame(game);
}

async function removeGame(gameCode) {
    return await deleteGame(gameCode);
}

// Export async-compatible functions
module.exports = {
    getGameByCode,
    saveGameState,
    removeGame,
    cleanupOldGames
};
