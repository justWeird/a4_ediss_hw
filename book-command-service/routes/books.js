//books route for book-command-service

// routes/books.js
const express = require('express');
const router = express.Router();
const bookModel = require('../models/bookModel');
const { validateBook } = require('../middleware/validation');

// Add Book endpoints - only endpoints for updating (POST, PUT, PATCH)
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

module.exports = router;