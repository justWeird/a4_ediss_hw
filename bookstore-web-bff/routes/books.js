const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');
const {validateBook} = require('../middleware/validation');


//readiness probe. checks if external service is ready.
router.get('/status/', async (req, res) => {

  const mode = req.query.mode;

  if (!mode) {
    return res.status(400).json({ status: 'Missing mode parameter: Command or Query Service' });
  }

  try {
    const result = await bookService.status(mode);
    res.status(200).json({status: 'Books service reachable'});
  } catch (error) {
    res.status(503).json({status: 'Books service down'});
  }

});


router.post('/', validateBook, async (req, res) => {
  try {
    //get book from request
    const book = req.body;

    // Check if ISBN already exists. Call the method in the service object. This calls the backend service
    const isbnExists = await bookService.isbnExists(book.ISBN);
    if (isbnExists) {
      return res.status(422).json({ message: "This ISBN already exists in the system." });
    }

    // Add book to database
    const newBook = await bookService.addBook(book);

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
    //get the important parameters needed
    const { ISBN } = req.params;
    const book = req.body;

    // Check if ISBN in URL matches ISBN in request body
    if (ISBN !== book.ISBN) {
      return res.status(400).json({ message: "ISBN in URL does not match ISBN in request body" });
    }

    // Check if ISBN exists
      const existingBook = await bookService.getBookByISBN(ISBN);

      //if the book doesn't exist, then shift
      if (!existingBook) {
        return res.status(404).json({ message: "Book not found" });
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
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve Book endpoint (both /books/:ISBN and /books/isbn/:ISBN)
router.get('/isbn/:ISBN', async (req, res) => {
  try {
    const { ISBN } = req.params;

    // Get book from database
    const book = await bookService.getBookByISBN(ISBN);   //the call to this service throws 404 if book is not found
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Return successful response
    res.status(200).json(book);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({message: "Book not found"});
    }
    console.error('Error retrieving book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Additional route for /books/isbn/:ISBN
router.get('/:ISBN', async (req, res) => {
  try {
    const { ISBN } = req.params;

      // Get book from service
      const book = await bookService.getBookByISBN(ISBN);     //the call to this service throws 404 if book is not found

      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      // Return successful response
      res.status(200).json(book);

  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({message: "Book not found"});
    }
    console.error('Error retrieving book:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//additional route for the recommendation engine
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