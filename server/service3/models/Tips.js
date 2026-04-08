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

const TipModel = mongoose.model("Tips", TipSchema)

module.exports = TipModel