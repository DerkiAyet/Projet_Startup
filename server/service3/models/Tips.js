const mongoose = require('mongoose')
const { Schema } = mongoose

const TipSchema = new Schema({
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

    content: {
        type: String,
        required: true
    },

    category: {
        id: { type: Number, required: false },
        subCategory: { type: Number }
    },

    ratings: [
        {
            userId: { type: Number, required: true },
            rating: {type: Number, required: true},
            ratedAt: { type: Date, default: Date.now }
        }
    ],

    visibility: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

TipSchema.methods.averageRating = function () {
    if (!this.ratings.length) return 0;

    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    return +(total / this.ratings.length).toFixed(2);
};

const TipModel = mongoose.model("Tips", TipSchema)

module.exports = TipModel