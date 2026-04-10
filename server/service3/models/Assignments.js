const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProblematiqueSchema = new Schema({
    title: String,
    content: String, 
    solution: String,
    points: Number
}, { timestamps: true })

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

const AssignmentModel = mongoose.model("Assignments", AssignmentSchema)

module.exports = AssignmentModel;