//mysql and rds connection config
const mongoose = require('mongoose');

// Test database connection
async function testConnection() {
    try {
        //create the connection
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to database: ${error.message}`);
        process.exit(1);
    }
}

//expose these variables for use in other packages
module.exports = { testConnection };