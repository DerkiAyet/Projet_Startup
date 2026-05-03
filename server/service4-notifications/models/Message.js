const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversations",
        required: true
    },

    senderId: {
        type: Number,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    readBy: [
        {
            userId: { type: String }
        }
    ],

}, {
    timestamps: true,
})

const MessageModel = mongoose.model("Messages", MessageSchema)

module.exports = MessageModel