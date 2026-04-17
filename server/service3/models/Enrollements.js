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

EnrollmentSchema.methods.calculateProgress = function (course) {
  if (!course || !course.lessons) return 0;

  const totalLessons = course.lessons.length;

  if (totalLessons === 0) return 0;

  const completedLessons = this.lessonsCompleted.length;

  const progress = (completedLessons / totalLessons) * 100;

  return Math.round(progress); // optional: round %
};

const EnrollementModel = mongoose.model("Enrollements", EnrollmentSchema)

module.exports = EnrollementModel