require('dotenv').config({ path: './config_server/config.env' });

const express = require('express')
const eurekaClient = require('./config_server/eureka.client')
const { startConsumer } = require('./config_server/kafka/consumer')
const { startProducer } = require('./config_server/kafka/producer')

const db = require('./models');
const path = require('path');

const app = express()
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Content Hub Service",
        status: "UP",
        version: "1.0.0",
    })
);

const recRoute = require('./routes/recommendations')
app.use('/recommendations', recRoute)

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

db.sequelize.sync().then(async () => {
    await startConsumer()
    await startProducer()
    app.listen(process.env.PORT, () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    })
}).catch((err) => {
    console.error("Unable to connect to the database:", err);
});
