const express = require("express");
const router = express.Router();
const Event = require("../models/Events");
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios');


// CREATE event
router.post("/", async (req, res) => {
    const teacherId = req.headers["x-user-id"];

    if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }

    try {
         const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const newEvent = new Event({ ...req.body, teacherId });
        const saved = await newEvent.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Cannot save event" });
    }
});

// GET all events of teacher
router.get("/", async (req, res) => {
    const teacherId = req.headers["x-user-id"];

    if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }
    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const events = await Event.find({ teacherId }).sort({ date: 1, startHour: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: "Cannot get events" });
    }
});

// DELETE event
router.delete("/:id", async (req, res) => {
    const teacherId = req.headers["x-user-id"];

    if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }

    try {
        await Event.findOneAndDelete({ _id: req.params.id, teacherId });
        res.json({ message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ error: "Cannot delete event" });
    }
});

router.get("/upcoming", async (req, res) => {
    const teacherId = req.headers["x-user-id"];
    const userRole = req.headers['x-user-role'];

    if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }

    if (userRole !== 'teacher') {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const today = new Date().toISOString().split("T")[0];
        const events = await Event.find({ date: { $gte: today }, teacherId })
            .sort({ date: 1, startHour: 1 });

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: "Cannot fetch upcoming events" });
    }
});

module.exports = router;