const mongoose = require('mongoose');
const { Schema } = mongoose;

const MCQOptionSchema = new Schema({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
});

const MCQQuestionSchema = new Schema({
    questionContent: { type: String, required: true },
    options: [MCQOptionSchema],
    explanation: { type: String },
    points: { type: Number, default: 1 },
    allowMultiple: { type: Boolean, default: false } // single or multiple correct answers
});

const ProblematiqueSchema = new Schema({
    title: String,
    exerciseType: {
        type: String,
        enum: ['text', 'mcq', 'file'],
        default: 'text'
    },
    content: String,        
    solution: String,      
    fileUrl: String,        // (for file type exercises — teacher uploads problem as PDF)
    questions: [MCQQuestionSchema], // (for mcq type)
    points: Number,
    hasSolution: { type: Boolean, default: false }
}, { timestamps: true });

const AssignmentSchema = new Schema({
    teacherId: {
        type: Number,
        required: true,
    },

    title: {
        type: String,
        required: false
    },

    description: {
        type: String
    },

    thumbnail: {
        type: String,
        required: false
    },

    level: {
        type: String,
        enum: [
            'Beginner',
            'Intermediate',
            'Advanced'
        ],
        required: true
    },

    category: {
        id: { type: Number, required: true },
        subCategory: { type: Number }
    },

    exercises: [ ProblematiqueSchema ],

    ratings: [
        {
            userId: { type: Number, required: true },
            rating: {type: Number, required: true},
            ratedAt: { type: Date, default: Date.now }
        }
    ],

    tags: [{ type: String }],

    maxScore: { type: Number },

    visibility: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

AssignmentSchema.methods.averageRating = function () {
    if (!this.ratings.length) return 0;

    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    return +(total / this.ratings.length).toFixed(2);
};

AssignmentSchema.methods.calculateMaxScore = function () {

    return this.exercises.reduce((total, exercise) => {

        // TEXT / FILE exercises
        if (exercise.exerciseType === "text" || exercise.exerciseType === "file") {
            return total + (exercise.points || 0);
        }

        // MCQ exercises
        if (exercise.exerciseType === "mcq") {
            const mcqTotal = (exercise.questions || []).reduce((qTotal, q) => {
                return qTotal + (q.points || 1);
            }, 0);

            return total + mcqTotal;
        }

        return total;

    }, 0);
};


const AssignmentModel = mongoose.model("Assignments", AssignmentSchema)

module.exports = AssignmentModel;