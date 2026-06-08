const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose')
const path = require('path')
const { startConsumer } = require('./config/kafka/consumer');
const { startProducer } = require('./config/kafka/producer')
const redis = require('./config/redis.config')

// Create Eureka client instance
const eurekaClient = require('./config/eureka.client')

const app = express();

// Middleware setup
app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ limit: '5gb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Content Service",
        status: "UP",
        version: "1.0.0",
    })
);


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

eurekaClient.start((error) => {
    console.log(error || "Node service registered with Eureka");
});

process.on("SIGINT", () => {
    console.log("Déconnexion de Eureka...");
    eurekaClient.stop(() => {
        console.log("Client Eureka déconnecté");
        process.exit();
    });
});

const { router: coursesRouter } = require('./routes/Courses')
app.use("/courses", coursesRouter)

const assignmentRoute = require('./routes/Assignments')
app.use("/assignments", assignmentRoute)

const tipsRoute = require('./routes/Tips')
app.use("/tips", tipsRoute)

const activityRoute = require('./routes/Progress');
app.use("/activity", activityRoute)

const EventsRoute = require('./routes/Events');
app.use("/events", EventsRoute)

const StatisticsRoute = require('./routes/Statistcs')
app.use("/stats", StatisticsRoute)

const resourcesRoute = require('./routes/Resources')
app.use('resources', resourcesRoute)

redis.on('connect', () => console.log("Redis Connected"))
redis.on('error', (err) => console.error("Error while connecting with Redis: ", err))

const startServer = async () => {
    try {
        await startConsumer();
        console.log('[Kafka] Consumer started');
        await startProducer();
        console.log('[Kafka] Producer started')
    } catch (err) {
        console.error('[Kafka] Consumer failed to start:', err.message);
        // don't crash the server if Kafka fails
    }

    const server = app.listen(process.env.PORT, () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    });

    server.timeout = 30 * 60 * 1000;
    server.keepAliveTimeout = 30 * 60 * 1000;
    server.headersTimeout = 31 * 60 * 1000;
};

startServer();
