// models/Follow.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SaveScheme = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: "posts",
        required: true,
    }
}, {
    timestamps: true
});

const Save = mongoose.model('Save', SaveScheme);

module.exports = Save;