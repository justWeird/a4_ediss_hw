// routes/customers.js
const express = require('express');
const router = express.Router();
const customerModel = require('../models/customerModel');
const { validateCustomer } = require('../middleware/validation');
const { sendCustomerRegistered } = require('../services/kafka-producer');

// Add Customer endpoints
router.post('/', validateCustomer, async (req, res) => {
  try {
    const customer = req.body;

    // Check if userId already exists
    const userIdExists = await customerModel.userIdExists(customer.userId);
    if (userIdExists) {
      return res.status(422).json({ message: "This user ID already exists in the system." });
    }

    // Add customer to database
    const newCustomer = await customerModel.addCustomer(customer);

    //after adding customer to db, then send to kafka topic
    await sendCustomerRegistered(newCustomer);

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
    const { id } = req.params;

    // Validate ID format (assuming IDs are numeric)
    if (isNaN(id) || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    // Get customer from database
    const customer = await customerModel.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Return successful response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve Customer by userId endpoint
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId parameter is required" });
    }

    // Add email validation check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userId)) {
      return res.status(400).json({ message: "userId must be a valid email address" });
    }

    // Get customer from database
    const customer = await customerModel.getCustomerByUserId(userId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Return successful response
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;