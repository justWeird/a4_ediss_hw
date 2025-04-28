//request validation logic

// middleware/validation.js
// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// US state validation (2-letter code)
const stateRegex = /^[A-Z]{2}$/;

const validation = {
    // Validate book data
    validateBook(req, res, next) {
        const { ISBN, title, Author, description, genre, price, quantity } = req.body;

        // Check if all required fields are present
        if (!ISBN || !title || !Author || !description || !genre || price === undefined || quantity === undefined) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        // Check if price is a valid number with 2 decimal places
        const priceStr = price.toString();
        if (isNaN(price) || !(/^\d+(\.\d{1,2})?$/.test(priceStr))) {
            return res.status(400).json({ message: "Price must be a valid number with 2 decimal places" });
        }

        next();
    }
};

module.exports = validation;