const mongoose = require('mongoose')

const XP_POINTS = {
    PUBLISH_POST: 5,
    NEW_FOLLOWEE: 5,
    NEW_FOLLOWER: 10,
    ENROLL_COURSE: 15,
    SOLVE_QUIZ: 20,
    SEND_SOLUTION: 50,
    GET_GRADE: 30, //on bonus       
    DO_HOMEWORK: 50,
    PARTICIPATE_CLASSROOM: 50,
    PARTICPATE_SESSION: 80,
    SHARE_RESSOURCE: 30
}

const MissionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            "PUBLISH_POST",
            "NEW_FOLLOWEE",
            "NEW_FOLLOWER",
            "ENROLL_COURSE",
            "SOLVE_QUIZ",
            "SEND_SOLUTION",
            "GET_GRADE",
            "PARTICIPATE_CLASSROOM",
            "DO_HOMEWORK",
            "PARTICPATE_SESSION",
            "SHARE_RESSOURCE"
        ],
        required: true
    },
    toDo: { // it's a number like enroll "3" courses mission
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

const levelSchema = new mongoose.Schema({
    creatorId:{
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    key: {
        type: Number, // level:0, 1,....
        required: true
    },
    coverImg: {
        type: String,
        default: null
    },
    missions: [MissionSchema],
    xpRequired: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

const LevelModel = mongoose.model('Level', levelSchema)

module.exports = {LevelModel, XP_POINTS}