const mongoose = require('mongoose')

const EDUCATION_POINTS = {
    ENROLL_COURSE: 2,
    SOLVE_QUIZ: 3,
    SEND_SOLUTION: 5,
    GET_GRADE: 2, //on bonus      
    DO_HOMEWORK: 5,
    PARTICIPATE_CLASSROOM: 5,
    PARTICPATE_SESSION: 8,
}

const achievementSchema = new mongoose.Schema({
    missionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    progress: {
        type: Number,
        default: 0        // how many times the action was done
    },
    completed: {
        type: Boolean,
        default: false
    },
    achievedAt: {
        type: Date,
        default: null     // null until completed
    }
})

const recordSchema = new mongoose.Schema({
    studentId: {
        type: Number,
        required: true
    },
    xp:{
        type: Number,
        default: 0
    },
    points: {
        type: Number,
        default: 0
    },
    currentLevelId: {                   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level',
        default: null
    },
    achievements: [achievementSchema] 
}, {
    timestamps: true
})

const RecordModel = mongoose.model("Record", recordSchema)

module.exports = {RecordModel, EDUCATION_POINTS}