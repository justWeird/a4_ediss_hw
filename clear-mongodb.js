// clear-mongodb.js
const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://jfadiji:teJ1nfXzcDEmxyUA@assignment4.yvbw3da.mongodb.net/BooksDB';
const client = new MongoClient(url);

async function clearCollection() {
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB server');

        // Get the database and collection
        const db = client.db('BooksDB');
        const collection = db.collection('books_jfadiji');

        // Count documents before deletion
        const countBefore = await collection.countDocuments();
        console.log(`Collection contains ${countBefore} documents before clearing`);

        // Delete all documents from the collection
        const result = await collection.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from books_jfadiji collection`);

    } catch (err) {
        console.error('Error clearing MongoDB collection:', err);
    } finally {
        // Close the connection
        await client.close();
        console.log('MongoDB connection closed');
    }
}

// Run the function
clearCollection().catch(console.error);