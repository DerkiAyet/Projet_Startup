const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose')
const path = require('path')

// Create Eureka client instance
const eurekaClient = require('./config/eureka.client')

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));
app.get("/info", (req, res) =>
    res.json({
        service: "Node Auth Service",
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

const postsRoute = require('./routes/Posts')
app.use('/', postsRoute)

app.listen(process.env.PORT, () => {
    console.log(`Node service is running on port ${process.env.PORT}`);
});

module.exports = { eurekaClient }