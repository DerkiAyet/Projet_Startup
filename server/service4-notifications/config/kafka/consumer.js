const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const usersCache = new Map();

const consumer = kafka.consumer({ groupId: 'notification-service-group' });

const startConsumer = async (handleCreateNotification, getIO) => {
    await consumer.connect();
    console.log('[Kafka] Notification consumer connected');

    // ── one topic for all notification events ──
    await consumer.subscribe({ topic: 'notifications.events', fromBeginning: true });
    await consumer.subscribe({ topic: 'users.sync', fromBeginning: true })
    await consumer.subscribe({ topic: 'socket.events', fromBeginning: true }); // pour les événements de socket (ex: classroom/session)

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const payload = JSON.parse(message.value.toString());

            if (topic === 'users.sync') {
                usersCache.set(String(payload.data.id), payload.data);
                console.log(`[Cache] User mis à jour: ${payload.data.id}`);
            }

            if (topic === 'notifications.events') {
                try {
                    const { type, payload } = JSON.parse(message.value.toString());
                    console.log(`[Kafka] Received event: ${type} → receiver: ${payload.idReceiver}`);

                    await handleCreateNotification({
                        idSender: payload.idSender,
                        idReceiver: payload.idReceiver,
                        title: payload.title,
                        message: payload.message,
                        type: type,
                        metadata: payload.metadata
                    });

                } catch (err) {
                    console.error('[Kafka] Failed to process notification event:', err.message);
                }
            } 

            if (topic === 'socket.events') {
                try {
                    const { room, event, data } = payload;
                    const io = getIO();

                    if (!io) {
                        console.error('[Kafka] io not ready yet');
                        return;
                    }

                    io.to(room).emit(event, data);
                    console.log(`[Kafka] Emitted "${event}" to room "${room}"`);

                } catch (err) {
                    console.error('[Kafka] Failed to process socket event:', err.message);
                }
                return;
            }
        }
    });
};

const getUser = (id) => usersCache.get(String(id)) || null;

module.exports = { startConsumer, getUser };