const express = require('express')
require('dotenv').config({ path: './config/config.env' })
const eurekaClient = require('./config/eureka.client')
const mongoose = require('mongoose')
const path = require('path')
const { startProducer } = require('./config/kafka/producer')
const { startConsumer } = require('./config/kafka/consumer')
const { router: achievementsRouter, progressMission, IntiateProgress } = require('./routes/achievements')
const levelsRoute = require('./routes/levels')
const redis = require('./config/redis.config')


const app = express();

// Middleware setup
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Notifications Service",
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

redis.on('connect', () => console.log("Connected to Redis"))
redis.on('error', (err) => console.error("Error while connecting to Redis: ", err))

app.use('/', levelsRoute)

app.use('/achievements', achievementsRouter); // <- the ; is important before the async function

(async () => {
    await startProducer();
    await startConsumer(progressMission, IntiateProgress);
    app.listen(process.env.PORT, async () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    })
})()