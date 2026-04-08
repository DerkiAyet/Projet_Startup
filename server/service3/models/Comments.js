const mongoose = require('mongoose')
const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    userId: Number,
    contentId: mongoose.Schema.Types.ObjectId,
    text: String,
    likes: [
      {
        userId: Number,
        likedAt: { type: Date, default: Date.now }
      }
    ],
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments"
      }
    ],
    contentType: String
  },
  { timestamps: true }
);

CommentSchema.methods.totalLikes = function () {
    return this.likes.length;
};

CommentSchema.statics.countForContent = async function (contentId) {
    return await this.countDocuments({ contentId }); // to make things easier just pass the id of object to count their comments
};

const CommentModel = mongoose.model("Comments", CommentSchema)

module.exports = CommentModel