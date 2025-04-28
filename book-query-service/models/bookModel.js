//model interacts with the DB. it queries the DB in CRUD

//import the pool element from the database directory. the pool executes all database query
const { pool } = require('../config/database');

//create the book model that will be used in other parts of the app
const bookModel = {
    // Add a new book
    async addBook(book) {
        //string literal for the query
        const query = `INSERT INTO books (ISBN, title, Author, description, genre, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // Parse price to float/number before inserting and fix to 2 decimal places
        const priceValue = parseFloat(parseFloat(book.price).toFixed(2));

        //execute the query and set the values to be added.
        const [result] = await pool.execute(query, [
            book.ISBN,
            book.title,
            book.Author,
            book.description,
            book.genre,
            priceValue,
            book.quantity
        ]);

        //return the book value
        return {
            ...book,
            price: priceValue // Ensure it returns as a number
        };
    },

    // Update a book
    async updateBook(ISBN, book) {
        const query = ` UPDATE books SET title = ?, Author = ?, description = ?, genre = ?, price = ?, quantity = ? WHERE ISBN = ?`;

        // Parse price to float/number before inserting and fix to 2 decimal places
        const priceValue = parseFloat(parseFloat(book.price).toFixed(2));
        //execute query and set values needed
        const [result] = await pool.execute(query, [
            book.title,
            book.Author,
            book.description,
            book.genre,
            priceValue,
            book.quantity,
            ISBN
        ]);

        //if the update goes through, it will affect certain rows
        if (result.affectedRows === 0) {
            return null;
        }

        //return the book
        // Return the book with the price as a number
        return {
            ...book,
            price: priceValue // Ensure it returns as a number
        };
    },

    // Get book by ISBN
    async getBookByISBN(ISBN) {
        const query = `SELECT * FROM books WHERE ISBN = ?`;

        const [rows] = await pool.execute(query, [ISBN]);

        if (rows.length === 0) {
            return null;
        }

        // Convert price to number when retrieving
        const book = rows[0];
        return {
            ...book,
            price: parseFloat(book.price) // Ensure it returns as a number
        };
    },

    // Check if a book exists
    async isbnExists(ISBN) {
        const query = `SELECT 1 FROM books WHERE ISBN = ? `;

        const [rows] = await pool.execute(query, [ISBN]);

        return rows.length > 0;
    }
};

//export the book model. to be used in routes and more
module.exports = bookModel;