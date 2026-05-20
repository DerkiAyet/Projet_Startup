const mongoose = require('mongoose');

const individualSheetSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollaborativeSession',
        required: true
    },
    studentId: {
        type: Number,
        required: true
    },
    exerciseId: {
        type: Number,  
        required: true
    },
    answer: {
        type: String,
        default: ''
    },
    // null → student still writing
    // Date → student locked their answer
    submittedAt: {
        type: Date,
        default: null
    },
    editCount: {
        type: Number,
        default: 0
    },
    lastEditedAt: {
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

individualSheetSchema.index(
    { sessionId: 1, studentId: 1, exerciseId: 1 },
    { unique: true }
);

const IndividualSheetModel = mongoose.model('IndividualSheet', individualSheetSchema);

module.exports = IndividualSheetModel;