//book route for book-query

// routes/books.js
const express = require('express');
const router = express.Router();
const bookModel = require('../models/bookModel');
const recommendationService = require('../services/recommendationService');

// Add Book endpoints - only contains get endpoints
// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
  try {
    const { ISBN } = req.params;

    // Get book from database
    const book = await waitForBookToAppear(ISBN);

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
    const book = await waitForBookToAppear(ISBN);
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

//new keyword search endpoint
router.get('/', async (req, res) => {
  const keyword = req.query.keyword;
  console.log(`[Keyword Route] Received request for keyword search with keyword: ${keyword}`);

  try {

    console.log(`[Keyword Route] Searching books in MongoDB`);
    const books = await bookModel.searchBooksByKeyword(keyword);

    if (books.length === 0) {
    console.log(`[Keyword Route] No related books found with keyword: ${keyword}`);
      return res.status(204).send();    //no content
    }

    //return the books
    console.log(`[Keyword Route] Found books. Returning Data`);
    return res.status(200).json(books);

  } catch (error) {
    if (error.message === 'Invalid keyword') {
    console.log(`[Keyword Route] Invalid keyword: ${keyword}`);
      return res.status(400).json({ message: "Invalid keyword. Only letters a..z and A..Z are allowed." });
    }
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }

})

async function waitForBookToAppear(ISBN, retries = 10, delayMs = 10000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const book = await bookService.getBookByISBN(ISBN);
      if (book) {
        return book;
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error; // Only swallow 404, real errors should be thrown
      }
    }
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return null; // Still not found after retries
}


module.exports = router;