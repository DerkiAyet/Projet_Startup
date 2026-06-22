const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'content-hub-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const usersCache = new Map();
const subjectsCache = new Map();
const subSubjectsCache = new Map();


const consumer = kafka.consumer({ groupId: 'content-hub-service-group' });

const startConsumer = async () => {
    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    await consumer.subscribe({ topic: 'users.sync', fromBeginning: true });
    // await consumer.subscribe({ topic: 'subjects.sync', fromBeginning: true });
    // await consumer.subscribe({ topic: 'sub-subjects.sync', fromBeginning: true });


    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const payload = JSON.parse(message.value.toString());

            if (topic === 'users.sync') {
                usersCache.set(String(payload.data.id), payload.data);
                console.log(`[Cache] User mis à jour: ${payload.data.id}`);
            }

            // if (topic === 'subjects.sync') {
            //     subjectsCache.set(String(payload.data.idSubject), payload.data);
            //     console.log(`[Cache] Subject mis à jour: ${payload.data.idSubject}`);
            // }

            // if (topic === 'sub-subjects.sync') {
            //     subSubjectsCache.set(String(payload.data.idSub), payload.data);
            //     console.log(`[Cache] Sub-subject mis à jour: ${payload.data.idSub}`);
            // }

        }
    });
};

const getUser = (id) => usersCache.get(String(id)) || null;
// const getSubject = (id) => subjectsCache.get(String(id)) || null;
// const getSubSubject = (id) => subSubjectsCache.get(String(id)) || null;


module.exports = { startConsumer, getUser };