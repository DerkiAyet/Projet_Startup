// models/Follow.js
const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    followerId: {
        type: Number,
        required: true,
    },
    followeeId: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'pending'],
        default: 'active'
    }
}, {
    timestamps: true
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;