//import needed modules
const { Kafka } = require('kafkajs');
const { sendWelcomeEmail } = require('./email-service');
require('dotenv').config();

//get Andrew ID from environment
const ANDREW_ID = process.env.ANDREW_ID || 'your-andrew-id';

//configure Kafka connection
const kafka = new Kafka({
    clientId: `${ANDREW_ID}-crm-service`,
    brokers: [
        '3.129.102.184:9092',
        '18.118.230.221:9093',
        '3.130.6.49:9094'
    ],
});

const consumer = kafka.consumer({
    groupId: `${ANDREW_ID}-crm-group`
});

async function startKafkaConsumer() {
    try {
        await consumer.connect();
        console.log('Connected to Kafka');

        //subscribe to customer events topic
        await consumer.subscribe({
            topic: `${ANDREW_ID}.customer.evt`,
            fromBeginning: true
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    //parse customer data from message
                    const customerData = JSON.parse(message.value.toString());
                    console.log('Received customer event:', customerData);

                    //send welcome email
                    await sendWelcomeEmail(customerData);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            },
        });

        //handle errors
        const errorTypes = ['unhandledRejection', 'uncaughtException'];
        const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

        errorTypes.forEach(type => {
            process.on(type, async () => {
                try {
                    console.log(`${type} signal received, closing consumer`);
                    await consumer.disconnect();
                    process.exit(0);
                } catch (error) {
                    console.error('Error during consumer disconnect:', error);
                    process.exit(1);
                }
            });
        });

        signalTraps.forEach(type => {
            process.once(type, async () => {
                try {
                    await consumer.disconnect();
                } finally {
                    process.kill(process.pid, type);
                }
            });
        });

    } catch (error) {
        console.error('Failed to start Kafka consumer:', error);
        throw error;
    }
}

module.exports = { startKafkaConsumer };