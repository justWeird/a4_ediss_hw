//book route for book-query

// routes/books.js
const express = require('express');
const router = express.Router();
const bookModel = require('../models/bookModel');
const recommendationService = require('../services/recommendationService');

// Add Book endpoints - only contains get endpoints
// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
  const { ISBN } = req.params;
  console.log(`[GET /isbn/${ISBN}] Received request`);

  try {
    console.log(`[GET /isbn/${ISBN}] Calling waitForBookToAppear`);
    const book = await waitForBookToAppear(ISBN);

    if (!book) {
      console.warn(`[GET /isbn/${ISBN}] Book not found after retries`);
      return res.status(404).json({ message: "Book not found" });
    }

    console.log(`[GET /isbn/${ISBN}] Book found. Returning response`);
    res.status(200).json(book);
  } catch (error) {
    console.error(`[GET /isbn/${ISBN}] Internal error:`, error.message || error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Additional route for /books/isbn/:ISBN
router.get('/:ISBN', async (req, res) => {
  const { ISBN } = req.params;
  console.log(`[GET /${ISBN}] Received request`);

  try {
    console.log(`[GET /${ISBN}] Calling waitForBookToAppear`);
    const book = await waitForBookToAppear(ISBN);

    if (!book) {
      console.warn(`[GET /${ISBN}] Book not found after retries`);
      return res.status(404).json({ message: "Book not found" });
    }

    console.log(`[GET /${ISBN}] Book found. Returning response`);
    res.status(200).json(book);
  } catch (error) {
    console.error(`[GET /${ISBN}] Internal error:`, error.message || error);
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

async function waitForBookToAppear(ISBN, retries = 9, delayMs = 8000) {
  console.log(`[WAIT-FOR-BOOK] Start polling for ISBN: ${ISBN}`);

  for (let attempt = 0; attempt < retries; attempt++) {
    console.log(`[WAIT-FOR-BOOK] Attempt ${attempt + 1} of ${retries}`);

    try {
      const book = await bookModel.getBookByISBN(ISBN);

      if (book) {
        console.log(`[WAIT-FOR-BOOK] Book found on attempt ${attempt + 1}: ${ISBN}`);
        return book;
      } else {
        console.log(`[WAIT-FOR-BOOK] Book not found on attempt ${attempt + 1}`);
      }
    } catch (error) {
      if (error.status !== 404) {
        console.error(`[WAIT-FOR-BOOK] Error on attempt ${attempt + 1}:`, error.message);
        throw error;
      } else {
        console.log(`[WAIT-FOR-BOOK] 404 on attempt ${attempt + 1}: Book not yet in MongoDB`);
      }
    }

    console.log(`[WAIT-FOR-BOOK] Waiting ${delayMs / 1000} seconds before retrying...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.warn(`[WAIT-FOR-BOOK] Book with ISBN ${ISBN} not found after ${retries} attempts`);
  return null; // Still not found after retries
}



module.exports = router;