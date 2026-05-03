const mongoose = require('mongoose')

const ConversationSchema = new mongoose.Schema({

    title: {
        type: String,
        default: null // this is for the group room, null if it is a direct conversation: 1-to-1 user
    },

    isGroup: {
        type: Boolean,
        default: false
    },

    members: [
        {
            userId: { type: Number, required: true },
            role: { type: String, enum: ['admin', 'member'], default: 'member' }
        }
    ],

    lastMessage:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages",
        default: null
    }

}, {
    timestamps: true
})

const ConversationModel = mongoose.model("Conversations", ConversationSchema)

module.exports = ConversationModel