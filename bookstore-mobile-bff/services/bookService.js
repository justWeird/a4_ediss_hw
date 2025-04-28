//service for communicating via HTTP to the backend service already existing
//use axios for this communication
const axios = require('axios')
require('dotenv').config();

//get the base url that the backend is using to make requests
const BASE_URL = process.env.BOOK_SERVICE_URL || 'http://book-service';

const bookService = {

    //status check
    status: async () => {
        try {
            return await axios.get(`${BASE_URL}/status`);
        } catch (error) {
            console.error('Error getting book status', error);
            throw error;
        }

    },

    //addBook
    addBook: async (book) => {
        try {
            //call a post request and send the book object in the post request
            const response = await axios.post(`${BASE_URL}/books/`, book);
            return response.data;       //return the response data
        } catch (error) {
            console.error('Error adding book', error);
            throw error;
        }
    },

    //updateBook
    updateBook: async (isbn, book) => {
        try {
            //first check if isbn exists
            const exists = await bookService.isbnExists(isbn);
            if (!exists) {
                // Just throw an error or return null
                const error = new Error('Book not found');
                error.status = 404;
                throw error;
            }

            //call a put request and send the book object in the put request with the ISBN used to fund it
            const response = await axios.put(`${BASE_URL}/books/${isbn}`, book);
            return response.data;       //return the response data
        } catch (error) {
            console.error('Error adding book', error);
            throw error;
        }

    },

    //get a book by ISBN
    getBookByISBN: async (isbn) => {
        try {
            //first check if isbn exists
            const exists = await bookService.isbnExists(isbn);
            if (!exists) {
                // Just throw an error or return null
                const error = new Error('Book not found');
                error.status = 404;
                throw error;
            }

            //call a get request
            const response = await axios.get(`${BASE_URL}/books/${isbn}`);
            return response.data;
        } catch (error) {
            console.error('Error getting book', error);
            throw error;
        }

    },

    //isbnExists
    isbnExists: async (isbn) => {
        try {
            //call a get request
            const response = await axios.get(`${BASE_URL}/books/${isbn}`);
            return true;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false; // Book does not exist — expected case
            }
            console.error('Error checking ISBN', error);
            throw error;
        }

    },

    //call recommendation
    // In bookService.js - callRecService method
    callRecService: async (isbn) => {
        console.log(`[BFF] Starting callRecService for ISBN: ${isbn}`);
        try {
            console.log(`[BFF] Making GET request to: ${BASE_URL}/books/${isbn}/related-books`);
            const response = await axios.get(`${BASE_URL}/books/${isbn}/related-books`);
            console.log(`[BFF] Received successful response with status: ${response.status}`);
            console.log(`[BFF] Response data: ${JSON.stringify(response.data).substring(0, 200)}...`);
            return {
                status: response.status,
                data: response.data
            };
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(`[BFF] Received error response with status: ${error.response.status}`);
                console.log(`[BFF] Error response data: ${JSON.stringify(error.response.data)}`);
                return {
                    status: error.response.status,
                    data: error.response.data
                };
            } else if (error.request) {
                // The request was made but no response was received
                console.log(`[BFF] Request made but no response received`);
                console.log(`[BFF] Error type: ${error.code}, Message: ${error.message}`);
                console.error('[BFF] Error request details:', error.request);
                return {
                    status: 503, // Service Unavailable
                    data: { message: "Recommendation service unavailable" }
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log(`[BFF] Error setting up request: ${error.message}`);
                console.log(`[BFF] Error stack: ${error.stack}`);
                return {
                    status: 500,
                    data: { message: "Internal server error" }
                };
            }
        }
    }

}

module.exports = bookService;