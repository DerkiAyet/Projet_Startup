const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'posts-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const producer = kafka.producer();

const startProducer = async () => {
    await producer.connect();
    console.log('[Kafka] Producer connected');
};

const publishNotification = async (type, payload) => {
    try {
        await producer.send({
            topic: 'notifications.events',
            messages: [
                {
                    key: type,
                    value: JSON.stringify({ type, payload })
                }
            ]
        });
        console.log(`[Kafka] Event published: ${type}`);
    } catch (err) {
        console.error(`[Kafka] Failed to publish event ${type}:`, err.message);
    }
};

const emitToRoom = async (room, event, data) => {
    await producer.send({
        topic: 'socket.events',
        messages: [{
            value: JSON.stringify({ room, event, data })
        }]
    });
};

module.exports = { startProducer, publishNotification, emitToRoom };