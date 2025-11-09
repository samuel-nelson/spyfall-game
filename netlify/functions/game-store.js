// Shared game store for all functions
// Note: This uses in-memory storage. For production with multiple Lambda instances,
// replace this with a database (MongoDB, PostgreSQL, DynamoDB, Redis, etc.)

const games = {};

// Clean up old games (older than 24 hours)
function cleanupOldGames() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const code in games) {
        if (games[code].createdAt && (now - games[code].createdAt) > maxAge) {
            delete games[code];
        }
    }
}

// Run cleanup periodically
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupOldGames, 60 * 60 * 1000); // Every hour
}

module.exports = {
    games,
    cleanupOldGames
};

