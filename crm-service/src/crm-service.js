//import needed modules
const express = require('express');
const { startKafkaConsumer } = require('./kafka-consumer');
require('dotenv').config();

//create express app
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

//health check endpoint for K8s liveness probe
app.get('/status', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

//start the server
app.listen(PORT, () => {
    console.log(`CRM service listening on port ${PORT}`);

    //start Kafka consumer
    startKafkaConsumer().catch(err => {
        console.error('Failed to start Kafka consumer:', err);
        process.exit(1);
    });
});