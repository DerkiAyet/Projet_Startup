const mongoose = require('mongoose')

const onlineCourseSchema = new mongoose.Schema({
    teacherId: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    thumbnail: String,
    platform: {
        type: String,
        enum: ['zoom', 'google_meet', 'youtube', 'teams', 'other'],
        required: true
    },
    sessionUrl: { type: String, required: true },  // the actual link
    schedule: {
        startDate: Date,
        endDate: Date,
        recurring: { type: Boolean, default: false }, //the session repeats on a regular basis. -> recurring: false — (one-time session, e.g. a single Zoom call on a specific date) - recurring: true — (the session repeats, e.g. every Monday at 10am)
        recurrencePattern: {
            type: String,
            enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        }
    },
    category: {
        id: { type: Number, required: true },
        subCategory: { type: Number, required: true }
    },
    visibility: { type: Boolean, default: true }
}, { timestamps: true })

onlineCourseSchema.methods.isOutdated = function () {
    if (!this.schedule?.endDate) return false;
    return new Date(this.schedule.endDate) < new Date();
};

const OnlineCourseModel = mongoose.model("OnlineCourses", onlineCourseSchema)

module.exports = OnlineCourseModel