const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'classrooms-service',
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

const updateGamification = async (missionType, studentId) => {
    try {
        await producer.send({
            topic: 'gamification.events',
            messages: [
                {
                    key: missionType,
                    value: JSON.stringify({ missionType, studentId })
                }
            ]
        });
        console.log(`[Kafka] Game Event published: ${missionType}`);
    } catch (err) {
        console.error(`[Kafka] Game Failed to publish event ${missionType}:`, err.message);
    }
};

module.exports = { startProducer, publishNotification, emitToRoom, updateGamification };