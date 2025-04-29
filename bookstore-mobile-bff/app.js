//import needed libraries
const express = require('express');
const cors = require('cors');
const bookCommandRoutes = require('./routes/books-command');
const bookQueryRoutes = require('./routes/books-query');
const customerRoutes = require('./routes/customers');
const {validateJWT} = require('./middleware/jwtMiddleware');
const clientTypeMiddleware = require('./middleware/clientTypeMiddleware');
require('dotenv').config();

//initialize the server to use express
const app = express();

//set the port. It is exposed on docker as well
const PORT = parseInt(process.env.PORT, 10) || 80;

app.use(cors());
app.use(express.json());

// Status endpoint
app.get('/status', (req, res) => {
    res.status(200).json({ status: 'OK' });
});


// Middleware for all routes
app.use(clientTypeMiddleware);
app.use(validateJWT);

// Routes
app.use('/books', bookQueryRoutes);
app.use('/cmd/books', bookCommandRoutes);
app.use('/customers', customerRoutes);

app.listen(PORT, () => {
    console.log(`Mobile BFF service running on port ${PORT}`);
});