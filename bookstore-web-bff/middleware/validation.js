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
            return res.status(401).json({ message: "All fields are mandatory" });
        }

        // Check if price is a valid number with 2 decimal places
        const priceStr = price.toString();
        if (isNaN(price) || !(/^\d+(\.\d{1,2})?$/.test(priceStr))) {
            return res.status(401).json({ message: "Price must be a valid number with 2 decimal places" });
        }

        next();
    },

    // Validate customer data
    validateCustomer(req, res, next) {
        const { userId, name, phone, address, city, state, zipcode } = req.body;

        // Check if all required fields are present (address2 is optional)
        if (!userId || !name || !phone || !address || !city || !state || !zipcode) {
            return res.status(401).json({ message: "All fields except address2 are mandatory" });
        }

        // Validate email format
        if (!emailRegex.test(userId)) {
            return res.status(401).json({ message: "userId must be a valid email address" });
        }

        // Validate state (2-letter US state)
        if (!stateRegex.test(state)) {
            return res.status(401).json({ message: "state must be a valid 2-letter US state abbreviation" });
        }

        next();
    }
};

module.exports = validation;