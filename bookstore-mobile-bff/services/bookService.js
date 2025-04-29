//service for communicating via HTTP to the backend service already existing
//use axios for this communication
const axios = require('axios')
require('dotenv').config();

//get the base url that the backend is using to make requests
const COMMAND_BASE_URL = process.env.BOOK_COMMAND_SERVICE_URL || 'http://book-command-service';
const QUERY_BASE_URL = process.env.BOOK_QUERY_SERVICE_URL || 'http://book-query-service';

// Log configuration at startup
console.log('=== SERVICE CONFIGURATION ===');
console.log(`COMMAND_BASE_URL: ${COMMAND_BASE_URL}`);
console.log(`QUERY_BASE_URL: ${QUERY_BASE_URL}`);
console.log('============================');

const bookService = {

    //status check
    commandStatus: async () => {
        const url = `${COMMAND_BASE_URL}/status`;
        console.log(`[COMMAND-STATUS] Making request to: ${url}`);
        try {
            const response = await axios.get(url);
            console.log(`[COMMAND-STATUS] Response status: ${response.status}`);
            return response;
        } catch (error) {
            console.error(`[COMMAND-STATUS] Error: ${error.message}`);
            if (error.response) {
                console.error(`[COMMAND-STATUS] Response status: ${error.response.status}`);
                console.error(`[COMMAND-STATUS] Response data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error(`[COMMAND-STATUS] No response received. Request details:`, error.request);
            }
            throw error;
        }
    },

    queryStatus: async () => {
        const url = `${QUERY_BASE_URL}/status`;
        console.log(`[QUERY-STATUS] Making request to: ${url}`);
        try {
            const response = await axios.get(url);
            console.log(`[QUERY-STATUS] Response status: ${response.status}`);
            return response;
        } catch (error) {
            console.error(`[QUERY-STATUS] Error: ${error.message}`);
            if (error.response) {
                console.error(`[QUERY-STATUS] Response status: ${error.response.status}`);
                console.error(`[QUERY-STATUS] Response data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error(`[QUERY-STATUS] No response received. Request details:`, error.request);
            }
            throw error;
        }
    },

    //addBook
    addBook: async (book) => {
        const url = `${COMMAND_BASE_URL}/cmd/books/`;
        console.log(`[ADD-BOOK] Making POST request to: ${url}`);
        console.log(`[ADD-BOOK] Request payload: ${JSON.stringify(book)}`);
        try {
            //call a post request and send the book object in the post request
            const response = await axios.post(url, book);
            console.log(`[ADD-BOOK] Response status: ${response.status}`);
            console.log(`[ADD-BOOK] Response data: ${JSON.stringify(response.data)}`);
            return response.data;       //return the response data
        } catch (error) {
            console.error(`[ADD-BOOK] Error: ${error.message}`);
            if (error.response) {
                console.error(`[ADD-BOOK] Response status: ${error.response.status}`);
                console.error(`[ADD-BOOK] Response data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error(`[ADD-BOOK] No response received. Request details:`, error.request);
            }
            throw error;
        }
    },

    //updateBook
    updateBook: async (isbn, book) => {
        console.log(`[UPDATE-BOOK] Starting updateBook for ISBN: ${isbn}`);
        try {
            //first check if isbn exists
            console.log(`[UPDATE-BOOK] Checking if ISBN exists: ${isbn}`);
            const exists = await bookService.isbnExists(isbn);
            console.log(`[UPDATE-BOOK] ISBN exists check result: ${exists}`);

            if (!exists) {
                console.log(`[UPDATE-BOOK] ISBN ${isbn} not found, throwing 404`);
                // Just throw an error or return null
                const error = new Error('Book not found');
                error.status = 404;
                throw error;
            }

            const url = `${COMMAND_BASE_URL}/cmd/books/${isbn}`;
            console.log(`[UPDATE-BOOK] Making PUT request to: ${url}`);
            console.log(`[UPDATE-BOOK] Request payload: ${JSON.stringify(book)}`);

            //call a put request and send the book object in the put request with the ISBN used to fund it
            const response = await axios.put(url, book);
            console.log(`[UPDATE-BOOK] Response status: ${response.status}`);
            console.log(`[UPDATE-BOOK] Response data: ${JSON.stringify(response.data)}`);
            return response.data;       //return the response data
        } catch (error) {
            console.error(`[UPDATE-BOOK] Error: ${error.message}`);
            if (error.response) {
                console.error(`[UPDATE-BOOK] Response status: ${error.response.status}`);
                console.error(`[UPDATE-BOOK] Response data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error(`[UPDATE-BOOK] No response received. Request details:`, error.request);
            }
            throw error;
        }
    },

    //get a book by ISBN
    getBookByISBN: async (isbn) => {
        console.log(`[GET-BOOK] Starting getBookByISBN for ISBN: ${isbn}`);
        try {
            // MODIFIED: Remove circular reference by directly making the request
            const url = `${QUERY_BASE_URL}/books/${isbn}`;
            console.log(`[GET-BOOK] Making GET request to: ${url}`);

            const response = await axios.get(url);
            console.log(`[GET-BOOK] Response status: ${response.status}`);
            console.log(`[GET-BOOK] Response data: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            console.error(`[GET-BOOK] Error: ${error.message}`);
            if (error.response) {
                console.error(`[GET-BOOK] Response status: ${error.response.status}`);
                console.error(`[GET-BOOK] Response data: ${JSON.stringify(error.response.data)}`);

                if (error.response.status === 404) {
                    console.log(`[GET-BOOK] Book with ISBN ${isbn} not found`);
                    const notFoundError = new Error('Book not found');
                    notFoundError.status = 404;
                    throw notFoundError;
                }
            } else if (error.request) {
                console.error(`[GET-BOOK] No response received. Request details:`, error.request);
            }
            throw error;
        }
    },

    //isbnExists
    isbnExists: async (isbn) => {
        console.log(`[ISBN-EXISTS] Checking if ISBN exists: ${isbn}`);
        try {
            // MODIFIED: Use getBookByISBN and catch 404 errors
            await bookService.getBookByISBN(isbn);
            console.log(`[ISBN-EXISTS] ISBN ${isbn} exists`);
            return true;
        } catch (error) {
            if (error.status === 404) {
                console.log(`[ISBN-EXISTS] ISBN ${isbn} does not exist`);
                return false; // Book does not exist — expected case
            }
            console.error(`[ISBN-EXISTS] Error checking ISBN: ${error.message}`);
            throw error;
        }
    },

    //call recommendation
    callRecService: async (isbn) => {
        console.log(`[REC-SERVICE] Starting callRecService for ISBN: ${isbn}`);
        try {
            const url = `${QUERY_BASE_URL}/books/${isbn}/related-books`;
            console.log(`[REC-SERVICE] Making GET request to: ${url}`);

            const response = await axios.get(url);
            console.log(`[REC-SERVICE] Response status: ${response.status}`);
            console.log(`[REC-SERVICE] Response data: ${JSON.stringify(response.data).substring(0, 200)}...`);
            return {
                status: response.status,
                data: response.data
            };
        } catch (error) {
            if (error.response) {
                console.error(`[REC-SERVICE] Response error status: ${error.response.status}`);
                console.error(`[REC-SERVICE] Response error data: ${JSON.stringify(error.response.data)}`);
                return {
                    status: error.response.status,
                    data: error.response.data
                };
            } else if (error.request) {
                console.error(`[REC-SERVICE] No response received. Request type: ${error.code}`);
                console.error(`[REC-SERVICE] Error message: ${error.message}`);
                return {
                    status: 503, // Service Unavailable
                    data: { message: "Recommendation service unavailable" }
                };
            } else {
                console.error(`[REC-SERVICE] Error setting up request: ${error.message}`);
                console.error(`[REC-SERVICE] Error stack: ${error.stack}`);
                return {
                    status: 500,
                    data: { message: "Internal server error" }
                };
            }
        }
    },

    //method for calling the keyword route via axios
    callKeywordSearch: async (keyword) => {
        console.log(`[KEYWORD-SEARCH] Starting callKeywordSearch for keyword: ${keyword}`);
        try {
            const url = `${QUERY_BASE_URL}/books?keyword=${keyword}`;
            console.log(`[KEYWORD-SEARCH] Making GET request to: ${url}`);

            const response = await axios.get(url);
            console.log(`[KEYWORD-SEARCH] Response status: ${response.status}`);
            console.log(`[KEYWORD-SEARCH] Response data: ${JSON.stringify(response.data).substring(0, 200)}...`);
            return {
                status: response.status,
                data: response.data
            };
        } catch (error) {
            if (error.response) {
                console.error(`[KEYWORD-SEARCH] Response error status: ${error.response.status}`);
                console.error(`[KEYWORD-SEARCH] Response error data: ${JSON.stringify(error.response.data)}`);
                return {
                    status: error.response.status,
                    data: error.response.data
                };
            } else if (error.request) {
                console.error(`[KEYWORD-SEARCH] No response received. Request type: ${error.code}`);
                console.error(`[KEYWORD-SEARCH] Error message: ${error.message}`);
                return {
                    status: 503, // Service Unavailable
                    data: { message: "Could not reach keyword service", error }
                };
            } else {
                console.error(`[KEYWORD-SEARCH] Error setting up request: ${error.message}`);
                console.error(`[KEYWORD-SEARCH] Error stack: ${error.stack}`);
                return {
                    status: 500,
                    data: { message: "Internal server error" }
                };
            }
        }
    }
}

module.exports = bookService;