const mongoose = require("mongoose");

const ProblemSolvedSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    exerciseType: {
        type: String,
        enum: ['text', 'mcq', 'file'],
        default: 'text'
    },

    // for text type : student writes their answer
    solution: { type: String },

    // for mcq type : student's selected answers per question
    mcqAnswers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId },
            selected: [{ type: String }], // selected option texts
            isCorrect: { type: Boolean, default: false }
        }
    ],

    // for file type : student uploads a PDF/image
    fileUrl: { type: String },

    grade: Number,
    teacherExplanation: { type: String }
});

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

    problemsSolved: [ProblemSolvedSchema],

    posted: {
        type: Boolean,
        default: false
    },

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

SolvingSchema.methods.calculateScore = function (assignment) {
    let total = 0;

    this.problemsSolved.forEach(problem => {
        if (problem.exerciseType === 'mcq' && assignment) {
            // auto-grade MCQ
            const exercise = assignment.exercises.id(problem.exerciseId);
            if (!exercise) return;

            problem.mcqAnswers.forEach(answer => {
                const question = exercise.questions.id(answer.questionId);
                if (!question) return;

                const correctTexts = question.options
                    .filter(o => o.isCorrect)
                    .map(o => o.text)
                    .sort()
                    .join(',');

                const selected = [...answer.selected].sort().join(',');
                answer.isCorrect = correctTexts === selected;
                if (answer.isCorrect) total += question.points || 1;
            });
        } else {
            // text/file → manually graded by teacher
            total += problem.grade || 0;
        }
    });

    this.score = total;
    return total;
};

const SolvingModel = mongoose.model("Solutions", SolvingSchema)

module.exports = SolvingModel