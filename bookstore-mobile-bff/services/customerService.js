//service for communicating via HTTP to the backend service already existing
//use axios for this communication
const axios = require('axios')
const res = require("express/lib/response");
require('dotenv').config();

//get the base url that the backend is using to make requests
const BASE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://customer-service';

const customerService = {

    //status check
    status: async () => {
        try {
            return await axios.get(`${BASE_URL}/status`);
        } catch (error) {
            console.error('Error getting book status', error);
            throw error;
        }

    },

    //addCustomer
    addCustomer: async (customer) => {
        try {
            //call a post request and send the book object in the post request
            const response = await axios.post(`${BASE_URL}/customers/`, customer);
            return response.data;       //return the response data
        } catch (error) {
            console.error('Error adding customer', error);
            throw error;
        }
    },

    //get a customer by ID
    getCustomerById: async (id) => {
        try {

            const exists = await customerService.idExists(id);
            if (!exists) {
                // Just throw an error or return null
                const error = new Error('Customer not found');
                error.status = 404;
                throw error;
            }

            //call a get request
            const response = await axios.get(`${BASE_URL}/customers/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error getting customer', error);
            throw error;
        }

    },

    //get a customer by userID (email)
    getCustomerByUserId: async (email) => {
        try {
            const exists = await customerService.userIdExists(email);  //  await async check
            if (!exists) {
                // Just throw an error or return null
                const error = new Error('Customer not found');
                error.status = 404;
                throw error;
            }

            //call a get request
            const response = await axios.get(`${BASE_URL}/customers?userId=${encodeURIComponent(email)}`);
            return response.data;
        } catch (error) {
            console.error('Error getting customer', error);
            throw error;
        }
    },

    //emailExists
    userIdExists: async (email) => {
        try {
            //call a get request
            const response = await axios.get(`${BASE_URL}/customers?userId=${encodeURIComponent(email)}`);
            return true;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false; // customer does not exist — expected case
            }
            console.error('Error checking customer', error);
            throw error;
        }

    },

    //id exists
    idExists: async (id) => {
        try {
            //call a get request
            const response = await axios.get(`${BASE_URL}/customers/${id}`);
            return true;

        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false; // customer does not exist — expected case
            }
            console.error('Error checking customer', error);
            throw error;
        }
    }

}

module.exports = customerService;