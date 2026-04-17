const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    teacherId: { type: Number, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },           // we make them string for easier handling on frontend, react-calendar will convert them to Date Object anyway
    startHour: { type: String, required: true },   
    endHour: { type: String, required: true },        
    type: { 
        type: String, 
        enum: ["Lecture", "Assessment", "Meeting", "Planning", "Support"],
        default: "Lecture" 
    }
}, { timestamps: true });

const EventModel = mongoose.model("Event", EventSchema);

module.exports = EventModel;