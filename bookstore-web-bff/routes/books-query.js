const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

//readiness probe. checks if external service is ready.
router.get('/status/', async (req, res) => {
    console.log('[QUERY-ROUTE] Received status check request');
    try {
        console.log('[QUERY-ROUTE] Calling queryStatus service');
        const result = await bookService.queryStatus();
        console.log('[QUERY-ROUTE] Status check successful');
        res.status(200).json({status: 'Books query service reachable'});
    } catch (error) {
        console.error('[QUERY-ROUTE] Status check failed:', error.message);
        res.status(503).json({status: 'Books query service down'});
    }
});

// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
    const { ISBN } = req.params;
    console.log(`[QUERY-ROUTE] Received GET request for book with ISBN path: ${ISBN}`);

    try {
        // Get book from database
        console.log(`[QUERY-ROUTE] Calling getBookByISBN for ISBN: ${ISBN}`);
        const book = await bookService.getBookByISBN(ISBN);

        if (!book) {
            console.log(`[QUERY-ROUTE] Book with ISBN ${ISBN} not found, returning 404`);
            return res.status(404).json({message: "Book not found"});
        }

        console.log(`[QUERY-ROUTE] Book found:`, JSON.stringify(book));

        // Return successful response
        console.log('[QUERY-ROUTE] Returning 200 OK response');
        res.status(200).json(book);
    } catch (error) {
        console.error(`[QUERY-ROUTE] Error retrieving book:`, error.message);
        if (error.status === 404) {
            console.log(`[QUERY-ROUTE] Book not found (404 error)`);
            return res.status(404).json({message: "Book not found"});
        }
        if (error.response) {
            console.error('[QUERY-ROUTE] Response status:', error.response.status);
            console.error('[QUERY-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        console.error('[QUERY-ROUTE] Error retrieving book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

// Additional route for /books/:ISBN
router.get('/:ISBN', async (req, res) => {
    const { ISBN } = req.params;
    console.log(`[QUERY-ROUTE] Received GET request for book with ISBN: ${ISBN}`);

    try {
        // Get book from service
        console.log(`[QUERY-ROUTE] Calling getBookByISBN for ISBN: ${ISBN}`);
        const book = await bookService.getBookByISBN(ISBN);

        if (!book) {
            console.log(`[QUERY-ROUTE] Book with ISBN ${ISBN} not found, returning 404`);
            return res.status(404).json({message: "Book not found"});
        }

        console.log(`[QUERY-ROUTE] Book found:`, JSON.stringify(book));

        //mobile bff modification
        if (book.genre === 'non-fiction') {
            console.log('[QUERY-ROUTE] Converting genre "non-fiction" to numeric value 3');
            book.genre = 3;
        }

        // Return successful response
        console.log('[QUERY-ROUTE] Returning 200 OK response');
        res.status(200).json(book);

    } catch (error) {
        console.error(`[QUERY-ROUTE] Error retrieving book:`, error.message);
        if (error.status === 404) {
            console.log(`[QUERY-ROUTE] Book not found (404 error)`);
            return res.status(404).json({message: "Book not found"});
        }
        if (error.response) {
            console.error('[QUERY-ROUTE] Response status:', error.response.status);
            console.error('[QUERY-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        console.error('[QUERY-ROUTE] Error retrieving book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

//route for recommendation book
router.get('/:ISBN/related-books', async (req, res) => {
    const { ISBN } = req.params;
    console.log(`[QUERY-ROUTE] Received request for related books with ISBN: ${ISBN}`);

    try {
        console.log(`[QUERY-ROUTE] Calling bookService.callRecService for ISBN: ${ISBN}`);
        const result = await bookService.callRecService(ISBN);

        console.log(`[QUERY-ROUTE] Received result from callRecService with status: ${result.status}`);
        console.log(`[QUERY-ROUTE] Sending response with status: ${result.status}`);

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('[QUERY-ROUTE] Caught error:', error.message);
        if (error.response) {
            console.error('[QUERY-ROUTE] Response status:', error.response.status);
            console.error('[QUERY-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

//route for keyword search
router.get('/', async (req, res) => {
    const keyword = req.query.keyword;
    console.log(`[QUERY-ROUTE] Received request for keyword search: ${keyword}`);

    try {
        console.log(`[QUERY-ROUTE] Calling bookService.callKeywordSearch for keyword: ${keyword}`);
        const result = await bookService.callKeywordSearch(keyword);

        console.log(`[QUERY-ROUTE] Received result with status: ${result.status}`);
        console.log(`[QUERY-ROUTE] Sending response with status: ${result.status}`);

        //no body response
        if (result.status === 204) {
            console.log('[QUERY-ROUTE] No content found, returning 204');
            return res.status(204).send();
        }

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('[QUERY-ROUTE] Caught error:', error.message);
        if (error.response) {
            console.error('[QUERY-ROUTE] Response status:', error.response.status);
            console.error('[QUERY-ROUTE] Response data:', JSON.stringify(error.response.data));
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;