const express = require('express')
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose')
const path = require('path')
const { startProducer } = require('./config/kafka/producer')
const { startConsumer } = require('./config/kafka/consumer');

const eurekaClient = require('./config/eureka.client')

const app = express();

app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Posts Service",
        status: "UP",
        version: "1.0.0",
    })
);

const classroomRoute = require('./routes/classrooms');
app.use('/', classroomRoute)

const sessionRoute = require('./routes/sessions')
app.use('/sessions', sessionRoute)


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

(async () => {
    await startProducer();
    await startConsumer();
    app.listen(process.env.PORT, () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    });
})();  