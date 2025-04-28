// app.js
require('dotenv').config();

const express = require('express');
const { testConnection } = require('./config/database');

// Import routes
const booksRouter = require('./routes/books');

// Create Express app
const app = express();
const port = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(express.json());

// Test database connection
testConnection();

// Status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'OK' });
});


// Routes
app.use('/books', booksRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Book Server running on port ${port}`);
});

module.exports = app;