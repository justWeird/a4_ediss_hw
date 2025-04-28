//import the connection pool
const { pool } = require('../config/database');

//create the customer model
const customerModel = {
    // Add a new customer
    async addCustomer(customer) {
        const query = `INSERT INTO customers (userId, name, phone, address, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?) `;

        const [result] = await pool.execute(query, [
            customer.userId,
            customer.name,
            customer.phone,
            customer.address,
            customer.address2 || null,
            customer.city,
            customer.state,
            customer.zipcode
        ]);

        //json allows you to return multiple variables as a single object
        return {
            id: result.insertId,
            ...customer
        };
    },

    // Get customer by ID
    async getCustomerById(id) {
        const query = `SELECT * FROM customers WHERE id = ?`;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Get customer by userId (email)
    async getCustomerByUserId(userId) {
        const query = `SELECT * FROM customers WHERE userId = ?`;

        const [rows] = await pool.execute(query, [userId]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Check if a userId exists
    async userIdExists(userId) {
        const query = `SELECT 1 FROM customers WHERE userId = ?`;

        const [rows] = await pool.execute(query, [userId]);

        return rows.length > 0;
    }
};

//export the model to be used
module.exports = customerModel;