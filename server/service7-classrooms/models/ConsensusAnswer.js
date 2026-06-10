const mongoose = require('mongoose');

// the word consensus here is a bit of a misnomer — it's really just the "group answer" that students work on together after filling their individual sheets.
// it is a latin word that means "everyone", "agreement" or "harmony", and in the context of our app, it represents the collective answer that students collaboratively create during the consensus phase of the session.

const consensusAnswerSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollaborativeSession',
        required: true
    },
    exerciseId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    // userId of whoever is currently editing
    // null means the area is free to grab
    lockedBy: {
        type: Number,
        default: null
    },
    lockedAt: {
        type: Date,
        default: null
    },
    lastUpdatedBy: {
        type: Number,
        default: null
    },
    isFinal: {
        type: Boolean,
        default: false
    },
    finalizedAt: {
        type: Date,
        default: null
    },
    grade: {
        type: Number
    },
    teacherRemark: {
        type: String,
        default: null
    },
    gradedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

consensusAnswerSchema.index(
    { sessionId: 1, exerciseId: 1 },
    { unique: true }
);

const ConsensusAnswerModel = mongoose.model('ConsensusAnswer', consensusAnswerSchema);

module.exports = ConsensusAnswerModel;