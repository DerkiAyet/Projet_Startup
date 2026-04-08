const mongoose = require("mongoose");

const SolvingSchema = new mongoose.Schema({
    studentId: {
        type: Number,
        required: true
    },

    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignments",
        required: true
    },

    problemsSolved: [
        {
            id: {type: mongoose.Schema.Types.ObjectId},
            solution: { type: String },
            grade: Number,
            teacherExplination: { type: String }
        }
    ],

    score: { type: Number },

    // Whether the teacher has reviewed it:
    status: {
        type: String,
        enum: ["submitted", "reviewed", "graded"],
        default: "submitted"
    },

    teacherFeedBack: String,

    solvedAt: {
        type: Date,
        default: Date.now
    }
});

SolvingSchema.methods.calculateScore = function () {
    const total = this.problemsSolved.reduce((sum, problem) => {
        return sum + (problem.grade || 0);
    }, 0);

    this.score = total;
    return total;
};

const SolvingModel = mongoose.model("Solutions", SolvingSchema)

module.exports = SolvingModel