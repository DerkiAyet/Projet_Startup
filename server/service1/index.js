const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config({ path: './config_service/config.env' });
const { connectProducer } = require('./config_service/kafka/producer');

const db = require('./models');
const path = require('path');

// Create Eureka client instance
const eurekaClient = require('./config_service/eureka.client');

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Auth Service",
        status: "UP",
        version: "1.0.0",
    })
);

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

// Import routes
const authRoutes = require('./routes/Auth');
app.use('/', authRoutes);

const userRoutes = require('./routes/Users')
app.use('/infos', userRoutes)

db.sequelize.sync().then(async() => {
    await connectProducer();
    app.listen(process.env.PORT, () => {
        console.log(`Node service is running on port ${process.env.PORT}`);
    });
}).catch((err) => {
    console.error("Unable to connect to the database:", err);
});


