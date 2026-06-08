const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'posts-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const usersCache = new Map();
const subjectsCache = new Map();
const subSubjectsCache = new Map();
const studentInterestsCache = new Map();
const teacherExpertiseCache = new Map();

const consumer = kafka.consumer({ groupId: 'content-service-group' });

const handlers = {
    'users.sync': (payload) => {
        const { event, data } = payload;

        if (event === 'USER_UPDATED') {
            usersCache.set(String(data.id), data);
            console.log(`[Cache] User updated: ${data.id}`);
        }

        if (event === 'USER_DELETED') {
            usersCache.delete(String(data.id));
            console.log(`[Cache] User deleted: ${data.id}`);
        }
    },

    'subjects.sync': (payload) => {
        const { event, data } = payload;

        if (event === 'SUBJECT_UPDATED') {
            subjectsCache.set(String(data.idSubject), data);
            console.log(`[Cache] Subject updated: ${data.idSubject}`);
        }

        if (event === 'SUBJECT_DELETED') {
            subjectsCache.delete(String(data.idSubject));
            console.log(`[Cache] Subject deleted: ${data.idSubject}`);
        }
    },

    'sub-subjects.sync': (payload) => {
        const { event, data } = payload;

        if (event === 'SUB_SUBJECT_UPDATED') {
            subSubjectsCache.set(String(data.idSub), data);
            console.log(`[Cache] Sub-subject updated: ${data.idSub}`);
        }

        if (event === 'SUB_SUBJECT_DELETED') {
            subSubjectsCache.delete(String(data.idSub));
            console.log(`[Cache] Sub-subject deleted: ${data.idSub}`);
        }
    },

    'student-interests.sync': (payload) => {
        const { event, data } = payload;

        if (event === 'STUDENT_INTERESTS_UPDATED') {
            studentInterestsCache.set(String(data.idStudent), data.interestIds);
            console.log(`[Cache] Student interests updated: ${data.idStudent}`);
        }
    },

    'teacher-expertise.sync': (payload) => {
        const { event, data } = payload;

        if (event === 'TEACHER_EXPERTISE_UPDATED') {
            teacherExpertiseCache.set(String(data.idTeacher), data.expertiseIds);
            console.log(`[Cache] Teacher expertise updated: ${data.idTeacher}`);
        }
    }
};


const startConsumer = async () => {
    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    const topics = Object.keys(handlers);
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
    }

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = JSON.parse(message.value.toString());
                const handler = handlers[topic];

                if (handler) {
                    handler(payload);
                } else {
                    console.warn(`[Kafka] No handler for topic: ${topic}`);
                }

            } catch (error) {
                // Log and skip the bad message — don't crash the consumer
                console.error(
                    `[Kafka] Failed to process message | topic: ${topic} | partition: ${partition} | offset: ${message.offset}`,
                    error.message
                );
            }
        }
    });
};


const stopConsumer = async () => {
    await consumer.disconnect();
    console.log('[Kafka] Consumer disconnected');
};

process.on('SIGTERM', stopConsumer);
process.on('SIGINT', stopConsumer);


const getUser = (id) => usersCache.get(String(id)) || null;
const getSubject = (id) => subjectsCache.get(String(id)) || null;
const getSubSubject = (id) => subSubjectsCache.get(String(id)) || null;
const getStudentInterests = (userId) => studentInterestsCache.get(String(userId)) || [];
const getTeacherExpertise = (userId) => teacherExpertiseCache.get(String(userId)) || [];

module.exports = { 
    startConsumer, 
    stopConsumer,
    getUser, 
    getSubject, 
    getSubSubject, 
    getStudentInterests, 
    getTeacherExpertise 
};