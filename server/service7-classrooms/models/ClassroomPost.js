const mongoose = require('mongoose');

const classroomPostSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'course', 'assignment'],
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    refId: {
        type: String, 
        default: null
    },
    refTitle: {
        type: String,
        default: null
    },
    refThumbnail: {
        type: String,
        default: null
    },
    refCategory: {
        id: { type: Number},
        subCategory: { type: Number }
    }
}, { timestamps: true });

classroomPostSchema.index({ classroomId: 1, createdAt: -1 });

const ClassroomPostModel = mongoose.model('ClassroomPost', classroomPostSchema);

module.exports = ClassroomPostModel;