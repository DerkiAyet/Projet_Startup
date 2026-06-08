const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'gamification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const producer = kafka.producer();

const startProducer = async () => {
    await producer.connect();
    console.log('[Kafka] Producer connected');
};

const emitToGameRoom = async (room, event, data) => {
    await producer.send({
        topic: 'socket.events',
        messages: [{
            value: JSON.stringify({ room, event, data })
        }]
    });
};

module.exports = { startProducer, emitToGameRoom };