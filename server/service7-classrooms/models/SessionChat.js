const mongoose = require('mongoose');

const sessionChatSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollaborativeSession',
        required: true
    },
    senderId: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    readBy: [
        { userId: { type: Number }, readAt: { type: Date, default: Date.now } }
    ]
}, { timestamps: true });

sessionChatSchema.index({ classroomId: 1, createdAt: 1 });

const SessionChatModel = mongoose.model('SessionMessage', sessionChatSchema);

module.exports = SessionChatModel;