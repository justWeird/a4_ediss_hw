const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const {validateBook} = require('../middleware/validation');

//readiness probe. checks if external service is ready.
router.get('/status/', async (req, res) => {

    try {
        const result = await bookService.commandStatus();
        res.status(200).json({status: 'Books command service reachable'});
    } catch (error) {
        res.status(503).json({status: 'Books command service down'});
    }

});


router.post('/', validateBook, async (req, res) => {
    try {
        //get book from request
        const book = req.body;

        // Check if ISBN already exists. Call the method in the service object. This calls the backend service
        const isbnExists = await bookService.isbnExists(book.ISBN);
        if (isbnExists) {
            return res.status(422).json({message: "This ISBN already exists in the system."});
        }

        // Add book to database
        const newBook = await bookService.addBook(book);

        // Set location header
        res.location(`/books/${newBook.ISBN}`);

        // Return successful response
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

// Update Book endpoint
router.put('/:ISBN', validateBook, async (req, res) => {
    try {
        //get the important parameters needed
        const {ISBN} = req.params;
        const book = req.body;

        // Check if ISBN in URL matches ISBN in request body
        if (ISBN !== book.ISBN) {
            return res.status(400).json({message: "ISBN in URL does not match ISBN in request body"});
        }

        // Check if ISBN exists
        const existingBook = await bookService.getBookByISBN(ISBN);

        //if the book doesn't exist, then shift
        if (!existingBook) {
            return res.status(404).json({message: "Book not found"});
        }

        // Update book in database
        const updatedBook = await bookService.updateBook(ISBN, book);

        // Return successful response
        res.status(200).json(updatedBook);

    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({message: "Book not found"});
        }
        console.error('Error updating book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

module.exports = router;