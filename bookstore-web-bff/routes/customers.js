const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const {validateCustomer} = require('../middleware/validation');

//readiness probe
router.get('/status', async (req, res) => {
  try {
    const result = await customerService.status();
    res.status(200).json({status: 'Customers service reachable'});
  } catch (error) {
    res.status(503).json({status: 'Customers service down'});
  }

});

//create a customer
router.post('/', validateCustomer, async (req, res) => {
  try {
    //get customer details from body of request
    const customer = req.body;

    // Check if userId already exists
    const userIdExists = await customerService.userIdExists(customer.userId);
    if (userIdExists) {
      return res.status(422).json({ message: "This user ID already exists in the system." });
    }

    // Add customer to database
    const newCustomer = await customerService.addCustomer(customer);

    // Set location header
    res.location(`/customers/${newCustomer.id}`);

    // Return successful response
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve Customer by ID endpoint
router.get('/:id', async (req, res) => {
  try {
    //get the id from the request parameter
    const { id } = req.params;

    // Validate ID format (assuming IDs are numeric)
    if (isNaN(id) || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    // Get customer from database
    const customer = await customerService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Return successful response
    res.status(200).json(customer);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({message: "Customer not found"});
    }
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve Customer by userId endpoint
router.get('/', async (req, res) => {
  try {
    //get the userID from the query
    const { userId } = req.query;

    //if no user id
    if (!userId) {
      return res.status(400).json({ message: "userId parameter is required" });
    }

    // Add email validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userId)) {
      return res.status(400).json({ message: "userId must be a valid email address" });
    }

      // Get customer from database
      const customer = await customerService.getCustomerByUserId(userId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Return successful response
      res.status(200).json(customer);

  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({message: "Customer not found"});
    }
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;