const mongoose = require('mongoose');
const { Schema } = mongoose;

/** Recursive Comment Schema **/
const CommentSchema = new Schema({
    userId: {
        type: Number,
        required: true,
    },
    text: { type: String, required: true },
    likes: [
        {
            userId: { type: Number, required: true },
            likedAt: { type: Date, default: Date.now }
        }
    ],
}, { timestamps: true });

CommentSchema.add({
  replies: [CommentSchema]
});

/** Post Schema **/
const PostSchema = new Schema({
    userId: {
        type: Number,
        required: true,
    },

    content: {
        type: String,
        required: false
    },

    mediaUrl: {
        type: String
    },

    mediaType: {
        type: String
    },

    mediaSize: {
        type: Number
    },

    visibility: {
        type: Boolean,
        default: true
    },

    /** Likes on the post **/
    likes: [
        {
            userId: { type: Number, required: true },
            likedAt: { type: Date, default: Date.now }
        }
    ],

    /** Recursive comments structure **/
    comments: [CommentSchema],

    /** Tags (hashtags or keywords) **/
    tags: [{ type: String }],

    /** Mentions: users tagged inside the post **/
    mentions: [
        {
            userId: { type: Number },
            taggedAt: { type: Date, default: Date.now }
        }
    ],

    /** URLs detected inside content **/
    urls: [
        {
            url: { type: String },
            metadata: {
                title: String,
                description: String,
                image: String
            }
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);