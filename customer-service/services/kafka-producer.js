//import kafka module
const { Kafka } = require('kafkajs');

//configure Kafka producer
const kafka = new Kafka({
    clientId: 'customer-service',
    brokers: [
        '3.129.102.184:9092',
        '18.118.230.221:9093',
        '3.130.6.49:9094'
    ]
});

//this service is the producer so declare it as such
const producer = kafka.producer();

//connect to Kafka at service startup
async function connectKafka() {
    await producer.connect();
    console.log('Connected to Kafka');
}

//send customer registration event
async function sendCustomerRegistered(customer) {
    try {
        await producer.send({
            topic: `${process.env.ANDREW_ID}.customer.evt`,
            messages: [
                { value: JSON.stringify(customer) }
            ],
        });
        console.log('Customer registration event sent to Kafka');
    } catch (error) {
        console.error('Error sending to Kafka:', error);
    }
}

module.exports = {connectKafka, sendCustomerRegistered};