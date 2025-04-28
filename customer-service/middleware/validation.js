//request validation logic

// middleware/validation.js
// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// US state validation (2-letter code)
const stateRegex = /^[A-Z]{2}$/;

const validation = {

    // Validate customer data
    validateCustomer(req, res, next) {
        const { userId, name, phone, address, city, state, zipcode } = req.body;

        // Check if all required fields are present (address2 is optional)
        if (!userId || !name || !phone || !address || !city || !state || !zipcode) {
            return res.status(400).json({ message: "All fields except address2 are mandatory" });
        }

        // Validate email format
        if (!emailRegex.test(userId)) {
            return res.status(400).json({ message: "userId must be a valid email address" });
        }

        // Validate state (2-letter US state)
        if (!stateRegex.test(state)) {
            return res.status(400).json({ message: "state must be a valid 2-letter US state abbreviation" });
        }

        next();
    }
};

module.exports = validation;