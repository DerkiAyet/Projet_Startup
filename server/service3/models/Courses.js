const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonSchema = new Schema({
    title: String,
    content: String
}, { timestamps: true })

const CourseSchema = new Schema({
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

    lessons: [LessonSchema],

    ratings: [
        {
            userId: { type: Number, required: true },
            rating: { type: Number, required: true, min: 0, max: 5 },
            ratedAt: { type: Date, default: Date.now }
        }
    ],

    tags: [{ type: String }],

    visibility: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

CourseSchema.methods.averageRating = function () {
    if (!this.ratings.length) return 0;

    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    return +(total / this.ratings.length).toFixed(2);
};

const CourseModel = mongoose.model("Courses", CourseSchema)

module.exports = CourseModel;