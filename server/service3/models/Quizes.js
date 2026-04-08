const mongoose = require('mongoose')
const { Schema } = mongoose

const QuestionSchema = new Schema({
    questionContent: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswers: [{ type: String, required: true }],
    explanation: { type: String },
    points: { type: Number, default: 1 }
});


const QuizSchema = new Schema({
    teacherId: {
        type: Number,
        required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    difficulty: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner"
    },
    questions: [QuestionSchema],
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
        required: false
    },
    score: { type: Number }
}, { timestamps: true });

const QuizeModel = mongoose.model("Quizes", QuizSchema)

module.exports = QuizeModel