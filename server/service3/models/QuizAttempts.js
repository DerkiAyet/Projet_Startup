const mongoose = require("mongoose");
const { Schema } = mongoose;

const AnswerSchema = new Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  responses: [{ type: String, required: true }],
  isCorrect: { type: Boolean, default: false }   
});

// QuizAttempt Schema
const QuizAttemptSchema = new Schema({
  studentId: {
    type: Number,
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quizes",  
    required: true
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeTaken: { type: Number },   // in seconds
  maxScore: { type: Number },    // total points of quiz
  score: { type: Number, default: 0 },
  answers: [AnswerSchema]
}, { timestamps: true });


QuizAttemptSchema.methods.calculateScore = function (quiz) {
  let total = 0;

  this.answers.forEach(a => {
    const question = quiz.questions.id(a.questionId);
    if (!question) return;

    // Check if the selected responses match the correctAnswers exactly
    const correct = question.correctAnswers.sort().join(',') === a.responses.sort().join(',');
    a.isCorrect = correct;

    if (correct) total += question.points || 1;
  });

  this.score = total;
  return total;
};

const QuizAttemptModel = mongoose.model("QuizAttempt", QuizAttemptSchema);

module.exports = QuizAttemptModel;