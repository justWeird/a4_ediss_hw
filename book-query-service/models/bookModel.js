//book model for book-query-service
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    ISBN: {
        type: String,
        required: true,
        unique: true, // Equivalent to primary key
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    Author: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true // Optional: adds createdAt and updatedAt fields automatically
});
// In bookModel.js
const COLLECTION_NAME = 'books_jfadiji'; // Define it as a constant to avoid typos
const Book = mongoose.model('Book', bookSchema, COLLECTION_NAME);

//create the book model that will be used in other parts of the app
const bookModel = {

    // Get book by ISBN
    async getBookByISBN(ISBN) {
        const book = await Book.findOne({ ISBN }).lean();

        if (!book) {
            return null;
        }

        // Convert price from Decimal128 to number
        return {
            ISBN: book.ISBN,
            title: book.title,
            Author: book.Author,
            description: book.description,
            genre: book.genre,
            price: parseFloat(book.price.toString()),
            quantity: book.quantity
        };
    },

    // Check if a book exists by ISBN
    async isbnExists(ISBN) {
        const exists = await Book.exists({ ISBN });
        return !!exists;
    },

    async searchBooksByKeyword(keyword) {
        // Validate keyword (only letters a-zA-Z)
        if (!/^[a-zA-Z]+$/.test(keyword)) {
            throw new Error('Invalid keyword');
        }

        // Build a case-insensitive regex
        const regex = new RegExp(keyword, 'i');

        // Perform search in title, Author, description, or genre
        const books = await Book.find({
            $or: [
                { title: regex },
                { Author: regex },
                { description: regex },
                { genre: regex }
            ]
        }).lean();

        // Map price from Decimal128 to number
        return books.map(book => ({
            ISBN: book.ISBN,
            title: book.title,
            Author: book.Author,
            description: book.description,
            genre: book.genre,
            price: parseFloat(book.price.toString()),
            quantity: book.quantity
        }));
    }


};

//export the book model. to be used in routes and more
module.exports = bookModel;