const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '../config.env' });

const kafka = new Kafka({
    clientId: 'content-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:29092']
});

const usersCache = new Map();
const subjectsCache = new Map();
const subSubjectsCache = new Map();
const studentInterestsCache = new Map();
const teacherExpertiseCache = new Map();

const consumer = kafka.consumer({ groupId: 'content-service-group' });

const startConsumer = async () => {
    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    await consumer.subscribe({ topic: 'users.sync', fromBeginning: true });
    await consumer.subscribe({ topic: 'subjects.sync', fromBeginning: true });
    await consumer.subscribe({ topic: 'sub-subjects.sync', fromBeginning: true });
    await consumer.subscribe({ topic: 'student-interests.sync', fromBeginning: true });
    await consumer.subscribe({ topic: 'teacher-expertise.sync', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const payload = JSON.parse(message.value.toString());

            if (topic === 'users.sync') {
                usersCache.set(String(payload.data.id), payload.data);
                console.log(`[Cache] User mis à jour: ${payload.data.id}`);
            }
            if (topic === 'subjects.sync') {
                subjectsCache.set(String(payload.data.idSubject), payload.data);
                console.log(`[Cache] Subject mis à jour: ${payload.data.idSubject}`);
            }
            if (topic === 'sub-subjects.sync') {
                subSubjectsCache.set(String(payload.data.idSub), payload.data);
                console.log(`[Cache] Sub-subject mis à jour: ${payload.data.idSub}`);
            }
            if (topic === 'student-interests.sync') {
                studentInterestsCache.set(String(payload.data.idStudent), payload.data.interestIds);
            }
            if (topic === 'teacher-expertise.sync') {
                teacherExpertiseCache.set(String(payload.data.idTeacher), payload.data.expertiseIds);
            }
        }
    });
};

const getUser = (id) => usersCache.get(String(id)) || null;
const getSubject = (id) => subjectsCache.get(String(id)) || null;
const getSubSubject = (id) => subSubjectsCache.get(String(id)) || null;
const getStudentInterests = (userId) => studentInterestsCache.get(String(userId)) || [];
const getTeacherExpertise = (userId) => teacherExpertiseCache.get(String(userId)) || [];

module.exports = { startConsumer, getSubject, getSubSubject, getUser, getStudentInterests, getTeacherExpertise };