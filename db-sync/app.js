// sync-service/index.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const {syncWithRetry} = require("./sync-retry");

// Main sync function that will be called periodically
async function syncBooksData() {
    console.log('Starting data synchronization process...');

    // Connect to databases
    const rdsConnection = await connectToRDS();
    const mongoClient = await connectToMongoDB();

    try {
        // Perform the sync
        await syncWithRetry(rdsConnection, mongoClient);
        console.log('Sync completed successfully');
    } catch (error) {
        console.error('Error during synchronization:', error);
    } finally {
        // Close connections
        await rdsConnection.end();
        await mongoClient.close();
    }
}

// Connect to RDS (MySQL)
async function connectToRDS() {
    const connection = await mysql.createConnection({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE
    });
    console.log('Connected to RDS successfully');
    return connection;
}

// Connect to MongoDB
async function connectToMongoDB() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
}

// If running directly (for testing)
if (require.main === module) {
    syncBooksData()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { syncBooksData };