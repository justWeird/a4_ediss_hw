//book related end point

// routes/books.js
const express = require('express');
const router = express.Router();
const bookModel = require('../models/bookModel');
const { validateBook } = require('../middleware/validation');
const recommendationService = require('../services/recommendationService');

// Add Book endpoints
router.post('/', validateBook, async (req, res) => {
  try {
    const book = req.body;

    // Check if ISBN already exists
    const isbnExists = await bookModel.isbnExists(book.ISBN);
    if (isbnExists) {
      return res.status(422).json({ message: "This ISBN already exists in the system." });
    }

    // Add book to database
    const newBook = await bookModel.addBook(book);

    // Set location header
    res.location(`/books/${newBook.ISBN}`);

    // Return successful response
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update Book endpoint
router.put('/:ISBN', validateBook, async (req, res) => {
  try {
    const { ISBN } = req.params;
    const book = req.body;

    // Check if ISBN in URL matches ISBN in request body
    if (ISBN !== book.ISBN) {
      return res.status(400).json({ message: "ISBN in URL does not match ISBN in request body" });
    }

    // Check if ISBN exists
    const existingBook = await bookModel.getBookByISBN(ISBN);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Update book in database
    const updatedBook = await bookModel.updateBook(ISBN, book);

    // Return successful response
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
  try {
    const { ISBN } = req.params;

    // Get book from database
    const book = await bookModel.getBookByISBN(ISBN);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Return successful response
    res.status(200).json(book);
  } catch (error) {
    console.error('Error retrieving book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Additional route for /books/isbn/:ISBN
router.get('/:ISBN', async (req, res) => {
  try {
    const { ISBN } = req.params;

    // Get book from database
    const book = await bookModel.getBookByISBN(ISBN);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Return successful response
    res.status(200).json(book);
  } catch (error) {
    console.error('Error retrieving book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//related-books endpoint
router.get('/:ISBN/related-books', async (req, res) => {
  const { ISBN } = req.params;
  console.log(`[Backend Route] Received request for related books with ISBN: ${ISBN}`);

  try {
    console.log(`[Backend Route] Calling recommendationService.getRecommendations for ISBN: ${ISBN}`);
    const result = await recommendationService.getRecommendations(ISBN);
    console.log(`[Backend Route] Received result from getRecommendations with status: ${result.status}`);

    if (result.status === 200) {
      console.log(`[Backend Route] Sending 200 response with data length: ${result.data.length}`);
      return res.status(200).json(result.data);
    } else if (result.status === 204) {
      console.log('[Backend Route] Sending 204 response (No Content)');
      return res.status(204).send(); // No content
    } else {
      console.log(`[Backend Route] Sending error response with status: ${result.status}`);
      return res.status(result.status).json({ message: "Recommendation service unavailable" });
    }
  } catch (error) {
    console.error('[Backend Route] Error getting recommendations:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;