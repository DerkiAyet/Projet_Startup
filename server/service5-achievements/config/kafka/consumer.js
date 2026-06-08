const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'gamification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const usersCache = new Map();

const consumer = kafka.consumer({ groupId: 'gamification-service-group' });

const startConsumer = async (progressMission, IntiateProgress) => {
    await consumer.connect();
    console.log('[Kafka] Notification consumer connected');

    await consumer.subscribe({ topic: 'gamification.events', fromBeginning: true });
    await consumer.subscribe({ topic: 'gamification.sync', fromBeginning: true });
    await consumer.subscribe({ topic: 'users.sync', fromBeginning: true })

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const payload = JSON.parse(message.value.toString());
 
            if (topic === 'users.sync') {
                usersCache.set(String(payload.data.id), payload.data);
                console.log(`[Cache] User mis à jour: ${payload.data.id}`);
            }

            if (topic === 'gamification.events') {
                try {
                    const { missionType, studentId } = JSON.parse(message.value.toString());
                    console.log(`[Kafka] Received event: ${missionType} → receiver: ${studentId}`);

                    await progressMission(studentId, missionType);

                } catch (err) {
                    console.error('[Kafka] Failed to process notification event:', err.message);
                }
            }

             if (topic === 'gamification.sync') {
                try {
                    const { studentId } = JSON.parse(message.value.toString());
                    console.log(`[Kafka] Received new student for the game: ${studentId}`);

                    await IntiateProgress(studentId);

                } catch (err) {
                    console.error('[Kafka] Failed to process notification event:', err.message);
                }
            }
        }
    });
};

const getUser = (id) => usersCache.get(String(id)) || null;

module.exports = { startConsumer, getUser };