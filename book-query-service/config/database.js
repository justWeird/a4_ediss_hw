// In your config/database.js (or wherever you define your MongoDB connection)
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/BooksDB';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

const testConnection = async () => {
    try {
        // Just trigger the connection
        await connectDB();
    } catch (error) {
        console.error(`Error testing connection: ${error.message}`);
    }
};

module.exports = { connectDB, testConnection };