const mongoose = require('mongoose');

const classroomChatSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
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
        {userId: {type: Number}, readAt: {type: Date, default: Date.now}}
    ]
}, { timestamps: true });

classroomChatSchema.index({ classroomId: 1, createdAt: 1 });

const ClassroomChatModel = mongoose.model('ClassroomMessage', classroomChatSchema);

module.exports = ClassroomChatModel;