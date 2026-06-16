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
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Posts Service",
        status: "UP",
        version: "1.0.0",
    })
);

const postsRoute = require('./routes/Posts');
app.use('/', postsRoute);

const analyticsRoute = require('./routes/analytics');
app.use('/analytics', analyticsRoute);


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

redis.on('connect', () => console.log("Connected to Redis"));
redis.on('error', (err) => console.error('Redis error:', err));

// ✅ IIFE — s'appelle immédiatement
(async () => {
    await startConsumer();
    await startProducer();
    app.listen(process.env.PORT, () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    });
})();  // ← les parenthèses ici l'invoquent immédiatement