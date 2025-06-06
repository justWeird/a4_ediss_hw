const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const {validateBook} = require('../middleware/validation');

//readiness probe. checks if external service is ready.
router.get('/status/', async (req, res) => {
    console.log('[CMD-ROUTE] Received status check request');
    try {
        console.log('[CMD-ROUTE] Calling commandStatus service');
        const result = await bookService.commandStatus();
        console.log('[CMD-ROUTE] Status check successful');
        res.status(200).json({status: 'Books command service reachable'});
    } catch (error) {
        console.error('[CMD-ROUTE] Status check failed:', error.message);
        res.status(503).json({status: 'Books command service down'});
    }
});

router.post('/', validateBook, async (req, res) => {
    console.log('[CMD-ROUTE] Received POST request to add book');
    console.log('[CMD-ROUTE] Request body:', JSON.stringify(req.body));

    try {
        //get book from request
        const book = req.body;

        // Check if ISBN already exists. Call the method in the service object. This calls the backend service
        console.log(`[CMD-ROUTE] Checking if ISBN ${book.ISBN} exists`);
        const isbnExists = await bookService.isbnExists(book.ISBN);
        console.log(`[CMD-ROUTE] ISBN exists check result: ${isbnExists}`);

        if (isbnExists) {
            console.log(`[CMD-ROUTE] ISBN ${book.ISBN} already exists, returning 422`);
            return res.status(422).json({message: "This ISBN already exists in the system."});
        }

        // Add book to database
        console.log('[CMD-ROUTE] Adding book to database');
        const newBook = await bookService.addBook(book);
        console.log('[CMD-ROUTE] Book added successfully:', JSON.stringify(newBook));

        // Set location header
        const locationUrl = `/books/${newBook.ISBN}`;
        console.log(`[CMD-ROUTE] Setting location header to: ${locationUrl}`);
        res.location(locationUrl);

        // Return successful response
        console.log('[CMD-ROUTE] Returning 200 Created response');
        res.status(200).json(newBook);
    } catch (error) {
        console.error('[CMD-ROUTE] Error adding book:', error.message);
        if (error.response) {
            console.error('[CMD-ROUTE] Response status:', error.response.status);
            console.error('[CMD-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        res.status(500).json({message: "Internal server error"});
    }
});

// Update Book endpoint
router.put('/:ISBN', validateBook, async (req, res) => {
    const { ISBN } = req.params;
    console.log(`[CMD-ROUTE] Received PUT request to update book with ISBN: ${ISBN}`);
    console.log('[CMD-ROUTE] Request body:', JSON.stringify(req.body));

    try {
        //get the important parameters needed
        const book = req.body;

        // Check if ISBN in URL matches ISBN in request body
        console.log(`[CMD-ROUTE] Checking if URL ISBN ${ISBN} matches body ISBN ${book.ISBN}`);
        if (ISBN !== book.ISBN) {
            console.log('[CMD-ROUTE] ISBN mismatch, returning 400');
            return res.status(400).json({message: "ISBN in URL does not match ISBN in request body"});
        }

        // Update book in database
        console.log(`[CMD-ROUTE] Updating book with ISBN ${ISBN}`);
        const updatedBook = await bookService.updateBook(ISBN, book);
        console.log('[CMD-ROUTE] Book updated successfully:', JSON.stringify(updatedBook));

        // Return successful response
        console.log('[CMD-ROUTE] Returning 200 OK response');
        res.status(200).json(updatedBook);

    } catch (error) {
        console.error('[CMD-ROUTE] Error updating book:', error.message);
        if (error.status === 404) {
            console.log('[CMD-ROUTE] Book not found (404 error)');
            return res.status(404).json({message: "Book not found"});
        }
        if (error.response) {
            console.error('[CMD-ROUTE] Response status:', error.response.status);
            console.error('[CMD-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        console.error('[CMD-ROUTE] Error updating book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

module.exports = router;