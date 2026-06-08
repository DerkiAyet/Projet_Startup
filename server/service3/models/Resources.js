const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
    fileUrl: String,
    fileType: String,
    attachedAt: {
        type: Date,
        default: Date.now
    }
})

const resourceSchema = new mongoose.Schema({
    studentId: {
        type: Number,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description: String,
    thumbnail: String,
    category: {
        id: { type:Number, required: true },
        subCategory: { type:Number, required: true }
    },
    attachments: [attachmentSchema],
    ratings: [
        {
            userId: { type: Number, required: true },
            rating: { type: Number, required: true, min: 0, max: 5 },
            ratedAt: { type: Date, default: Date.now }
        }
    ],
    views: [
        {
            userId: { type: Number, required: true },
            viewedAt: { type: Date, default: Date.now }
        }
    ],
    visibility: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

resourceSchema.methods.averageRating = function () {
    if (!this.ratings.length) return 0;

    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    return +(total / this.ratings.length).toFixed(2);
};

const ResourceModel = mongoose.model("Resources", resourceSchema)

module.exports = ResourceModel