const mongoose = require('mongoose')

const homeworkDoneSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassroomPost',
        required: true
    },
    classroomId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    studentId: {
        type: Number,
        required: true
    },
    doneAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false })

const HomeWorkDoneModel = mongoose.model("HomeworkDone", homeworkDoneSchema)

module.exports = HomeWorkDoneModel