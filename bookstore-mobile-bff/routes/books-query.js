const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

//readiness probe. checks if external service is ready.
router.get('/status/', async (req, res) => {
    try {
        const result = await bookService.queryStatus();
        res.status(200).json({status: 'Books query service reachable'});
    } catch (error) {
        res.status(503).json({status: 'Books query service down'});
    }

});


// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
    try {
        const {ISBN} = req.params;

        // Get book from database
        const book = await bookService.getBookByISBN(ISBN);   //the call to this service throws 404 if book is not found
        if (!book) {
            return res.status(404).json({message: "Book not found"});
        }

        //mobile bff modification
        if (book.genre === 'non-fiction') {
            //assign to numeric value 3
            book.genre = 3;
        }

        // Return successful response
        res.status(200).json(book);
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({message: "Book not found"});
        }
        console.error('Error retrieving book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

// Additional route for /books/isbn/:ISBN
router.get('/:ISBN', async (req, res) => {
    try {
        const {ISBN} = req.params;

        // Get book from service
        const book = await bookService.getBookByISBN(ISBN);     //the call to this service throws 404 if book is not found

        if (!book) {
            return res.status(404).json({message: "Book not found"});
        }

        //mobile bff modification
        if (book.genre === 'non-fiction') {
            //assign to numeric value 3
            book.genre = 3;
        }

        // Return successful response
        res.status(200).json(book);

    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({message: "Book not found"});
        }
        console.error('Error retrieving book:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

//route for recommendation book
router.get('/:ISBN/related-books', async (req, res) => {
    const { ISBN } = req.params;
    console.log(`[BFF Route] Received request for related books with ISBN: ${ISBN}`);

    try {
        console.log(`[BFF Route] Calling bookService.callRecService for ISBN: ${ISBN}`);
        const result = await bookService.callRecService(ISBN);

        console.log(`[BFF Route] Received result from callRecService with status: ${result.status}`);
        console.log(`[BFF Route] Sending response with status: ${result.status}`);

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('[BFF Route] Caught error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//route for keyword search
router.get('/', async (req, res) => {

    const keyword = req.query.keyword;
    console.log(`[BFF Route] Received request for keyword search: ${keyword}`);

    try {
        console.log(`[BFF Route] Calling bookService.callKeywordSearch for keyword: ${keyword}`);
        const result = await bookService.callKeywordSearch(keyword);

        console.log(`[BFF Route] Received result from callRecService with status: ${result.status}`);
        console.log(`[BFF Route] Sending response with status: ${result.status}`);

        //no body response
        if (result.status === 204) {
            return res.status(204).send();
        }

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('[BFF Route] Caught error:', error);
        res.status(500).json({ message: "Internal server error" });
    }

})


module.exports = router;