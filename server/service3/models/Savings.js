const mongoose = require('mongoose');
const { Schema } = mongoose;

const SaveScheme = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
    },
    contentId: {
        type: Schema.Types.ObjectId,
        required: true,
    }
}, {
    timestamps: true
});

const Save = mongoose.model('Saves', SaveScheme);

module.exports = Save;