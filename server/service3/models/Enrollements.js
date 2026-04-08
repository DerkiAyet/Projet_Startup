const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: Number,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Courses",
    required: true
  },
  lessonsCompleted: [
    {
      type: mongoose.Schema.Types.ObjectId,
    }
  ],
  enrolledAt: {
    type: Date,
    default: Date.now
  }
});

const EnrollementModel = mongoose.model("Enrollements", EnrollmentSchema)

module.exports = EnrollementModel