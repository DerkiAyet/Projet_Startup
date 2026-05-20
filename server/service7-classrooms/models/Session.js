const mongoose = require('mongoose');

const collaborativeSessionSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    assignmentId: {
        type: String,  
        required: true
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
    },
    // 1 → individual writing (private)
    // 2 → discussion
    // 3 → consensus (shared writing area)
    phase: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    },
    deadline: {
        type: Date,
        default: null
    },
    phaseDurations: {
        phase1: { type: Number, default: 20 },  // in minutes
        phase2: { type: Number, default: 20 },
        phase3: { type: Number, default: 20 }
    },
    phaseStartedAt: {
        phase1: { type: Date, default: null },
        phase2: { type: Date, default: null },
        phase3: { type: Date, default: null }
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

collaborativeSessionSchema.index({ classroomId: 1 });
collaborativeSessionSchema.index({ assignmentId: 1 });

const SessionModel = mongoose.model('CollaborativeSession', collaborativeSessionSchema);

module.exports = SessionModel;