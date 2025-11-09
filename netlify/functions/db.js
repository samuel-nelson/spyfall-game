// MongoDB connection module
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spyfall';

// Database and collection names
const DB_NAME = 'spyfall';
const COLLECTION_NAME = 'games';

async function connect() {
    if (client && db) {
        return db;
    }

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

async function getCollection() {
    const database = await connect();
    return database.collection(COLLECTION_NAME);
}

// Game store functions using MongoDB
async function getGame(gameCode) {
    const collection = await getCollection();
    return await collection.findOne({ code: gameCode.toUpperCase() });
}

async function saveGame(game) {
    const collection = await getCollection();
    await collection.updateOne(
        { code: game.code },
        { $set: game },
        { upsert: true }
    );
}

async function deleteGame(gameCode) {
    const collection = await getCollection();
    await collection.deleteOne({ code: gameCode.toUpperCase() });
}

async function cleanupOldGames() {
    const collection = await getCollection();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffTime = Date.now() - maxAge;
    
    await collection.deleteMany({
        createdAt: { $lt: cutoffTime }
    });
}

module.exports = {
    connect,
    getGame,
    saveGame,
    deleteGame,
    cleanupOldGames
};

