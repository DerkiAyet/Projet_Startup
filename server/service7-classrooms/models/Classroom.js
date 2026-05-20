const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const pendingRequestSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const classroomSchema = new mongoose.Schema({
    teacherId: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    coverImage: {
        type: String,
        default: null
    },
    members: {
        type: [memberSchema],
        default: []
    },
    pendingRequests: {
        type: [pendingRequestSchema],
        default: []
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

classroomSchema.index({ teacherId: 1 });
classroomSchema.index({ 'members.userId': 1 });

const ClassroomModel = mongoose.model('Classroom', classroomSchema);

module.exports = ClassroomModel;