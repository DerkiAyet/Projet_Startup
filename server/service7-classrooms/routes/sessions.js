const express = require('express')
const router = express.Router()
const { discoverAuthService } = require('../config/discovery.service')
const { getUser } = require('../config/kafka/consumer')
const axios = require('axios')
const ClassroomModel = require('../models/Classroom')
const SessionModel = require('../models/Session')
const IndividualSheetModel = require('../models/IndividualSheet')
const ConsensusAnswerModel = require('../models/ConsensusAnswer')
const SessionChatModel = require('../models/SessionChat')
const { emitToRoom, publishNotification, updateGamification } = require('../config/kafka/producer')
const { resolveUser } = require('../helpers/utils')
const redis = require('../config/redis.config')

router.post('/of-classroom/:classroomId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const { assignmentId, deadline, phaseDurations, refTitle, refThumbnail, refCategory } = req.body;

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can create sessions' });
        if (!assignmentId)
            return res.status(400).json({ error: 'assignmentId is required' });

        const session = await SessionModel.create({
            classroomId: classroom._id,
            assignmentId,
            refTitle,
            refThumbnail,
            refCategory,
            deadline: deadline || null,
            phaseDurations: phaseDurations || undefined,
            phase: 1,
            'phaseStartedAt.phase1': new Date()
        });

        await emitToRoom(
            `classroom:${classroom._id}`,
            "classroom:new_session",
            { classroomId: classroom._id, session }
        )

        await Promise.all(
            classroom.members.map(({ userId }) =>
                publishNotification('SESSION_STARTED', {
                    idSender: teacherId,
                    idReceiver: userId,
                    title: 'Collaborative session started',
                    message: `A new collaborative session has started in ${classroom.name}`,
                    metadata: {
                        classroomId: classroom._id,
                        sessionId: session._id,
                        link: `/classrooms/${classroom._id}`
                    }
                })
            )
        );

        await redis.del(`sessions:classroom:${req.params.classroomId}`)
        return res.status(201).json(session)
    } catch (error) {
        console.log("error while creating the session", error.message)
        res.status(500).json("error: ", error.message)
    }
})

router.get('/of-classroom/:classroomId', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "student" && userRole !== "teacher") return res.status(403).json("Forbidden")

        const classroom = await ClassroomModel.findById(req.params.classroomId)
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' })

        const isMember = classroom.members.some(m => m.userId === userId)
        const isTeacher = classroom.teacherId === userId
        if (!isMember && !isTeacher) return res.status(403).json("user not a member in this class")

        const cacheKey = `sessions:classroom:${req.params.classroomId}`
        const cached = await redis.get(cacheKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const sessions = await SessionModel.find({ classroomId: classroom._id })
        await redis.setex(cacheKey, 60, JSON.stringify(sessions))

        return res.status(200).json(sessions)
    } catch (error) {
        console.log(error.message)
        res.status(500).json("error: ", error.message)
    }
})

// get all infos of the session
router.get('/:sessionId', async (req, res) => {
    try {
        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const currentPhase = session.phase
        let finalSession;
        if (currentPhase > 1) {
            const sheets = await IndividualSheetModel.find({ sessionId: session._id })
            const consensus = await ConsensusAnswerModel.find({ sessionId: session._id })

            const enrichedSheets = await Promise.all(
                sheets.map(async (s) => {
                    const studentInfos = await resolveUser(s.studentId)

                    return {
                        ...s.toObject(),
                        studentInfos
                    }
                })
            )

            finalSession = {
                session,
                sheets: enrichedSheets,
                consensus
            }

        } else { // for phase 1 nothing is submitted yet
            finalSession = session
        }
        return res.status(200).json(finalSession);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

//------Teacher goes to next phase------//
router.put('/:sessionId/phase', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];
        if (userRole !== "teacher") return res.status(403).json({ error: 'Only teachers can change the phase' });

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const currentPhase = session.phase;
        if (currentPhase === 3) return res.status(400).json({ error: 'Cannot advance beyond Phase 3' });

        const classroom = await ClassroomModel.findById(session.classroomId);
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can change the phase' });

        session.phase = currentPhase + 1;
        session.phaseStartedAt[`phase${currentPhase + 1}`] = new Date();
        await session.save();

        await emitToRoom(
            `session:${session._id}`,
            'session:phase_updated',
            { sessionId: session._id, phase: session.phase }
        );

        const phaseLabels = {
            1: 'Phase 1 — Individual writing',
            2: 'Phase 2 — Group discussion',
            3: 'Phase 3 — Consensus writing'
        };

        await Promise.all(
            classroom.members.map(({ userId }) =>
                publishNotification('SESSION_PHASE_CHANGED', {
                    idSender: teacherId,
                    idReceiver: userId,
                    title: phaseLabels[session.phase],
                    message: `The session has moved to ${phaseLabels[session.phase]}`,
                    metadata: { sessionId: session._id, phase: session.phase }
                })
            )
        );

        return res.status(200).json(session);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

//------Teacher marks session as completed------//
router.put('/:sessionId/complete', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];
        if (userRole !== "teacher") return res.status(403).json({ error: 'Only teachers can mark the session as completed' });

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const classroom = await ClassroomModel.findById(session.classroomId);
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can mark the session as completed' });

        session.isCompleted = true;
        session.completedAt = new Date();
        await session.save();

        await emitToRoom(
            `session:${session._id}`,
            'session:completed',
            { sessionId: session._id }
        );

        await redis.del(`sessions:classroom:${session.classroomId}`)
        return res.status(200).json(session);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

//-------Individual sheet for a student in a session-------//
router.put('/:sessionId/sheets/:exerciseId', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];
        if (userRole !== "student") return res.status(403).json({ error: 'Only students can edit their sheets' });
        const { answer } = req.body;

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.isCompleted)
            return res.status(400).json({ error: 'Session is already completed' });

        const sheet = await IndividualSheetModel.findOneAndUpdate(
            {
                sessionId: session._id,
                studentId,
                exerciseId: req.params.exerciseId
            },
            {
                answer,
                lastEditedAt: new Date(),
                $inc: { editCount: 1 } // intresting metric to track how many times students edit their answers before submitting
            },
            { upsert: true, returnDocument: 'after' } // the upsert option creates a new document if no document matches the query, and the new option returns the modified document rather than the original
        );

        // phase 1 answers are private!!
        return res.status(200).json(sheet);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

router.put('/:sessionId/sheets/:exerciseId/submit', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id']);
        const { answer } = req.body;

        // Check if sheet already existed before upserting
        const existingSheet = await IndividualSheetModel.findOne({
            sessionId: req.params.sessionId,
            studentId,
            exerciseId: req.params.exerciseId
        })
        const isFirstSubmission = !existingSheet?.submittedAt

        const sheet = await IndividualSheetModel.findOneAndUpdate(
            {
                sessionId: req.params.sessionId,
                studentId,
                exerciseId: req.params.exerciseId
            },
            {
                answer,
                submittedAt: new Date(),
                $inc: { editCount: 1 }
            },
            { upsert: true, returnDocument: 'after' }
        );

        if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

        const studentInfos = await resolveUser(studentId)
        const enrichedSheet = { ...sheet.toObject(), student: studentInfos }

        await emitToRoom(
            `session:${req.params.sessionId}`,
            'session:student_submitted',
            {
                sessionId: req.params.sessionId,
                student: studentInfos,
                exerciseId: req.params.exerciseId,
                sheet: enrichedSheet
            }
        );

        // Only reward on first submission, not re-submissions
        if (isFirstSubmission) {
            await updateGamification("PARTICIPATE_SESSION", studentId)
        }

        return res.status(200).json(sheet);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Get all sheets for a session (phase 2 and 3 + teacher) ──
router.get('/:sessionId/sheets', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);
        const role = req.headers['x-user-role'];

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // students can only see all answers after phase 1
        if (role !== 'teacher' && session.phase < 2)
            return res.status(403).json({ error: 'Answers are not visible yet' });

        const sheets = await IndividualSheetModel.find({
            sessionId: session._id
        });

        const enrichedSheets = await Promise.all(
            sheets.map(async (s) => {
                const studentInfos = await resolveUser(s.studentId)

                return {
                    ...s.toObject(),
                    student: studentInfos
                }
            })
        )

        return res.status(200).json(enrichedSheets);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

//----teacher submit a remark on a single sheet----

router.put('/:sessionId/sheets/:sheetId/grade', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json("Forbidden")

        const sheet = await IndividualSheetModel.findById(req.params.sheetId)
        if (!sheet) return res.status(404).json({ error: "sheet not found" })

        const session = await SessionModel.findById(sheet.sessionId)
        if (req.params.sessionId !== String(session._id)) return res.status(400).json({ error: "something is off, apparently the teacher isn't in the right session" })

        const classroom = await ClassroomModel.findById(session.classroomId)
        if (classroom.teacherId !== teacherId) return res.status(403).json("Forbidden")
        if (!sheet.submittedAt) return res.status(400).json({ error: "the sheet isn' submitted yet by student" })

        const { grade, teacherRemark } = req.body
        sheet.grade = grade
        sheet.teacherRemark = teacherRemark
        sheet.gradedAt = new Date()
        await sheet.save()

        return res.status(200).json(sheet)

    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
})

// CONSENSUS ----------- Most important and complicated one

/* The idea is when the session is in phase 3 the students will see a butoon called "lock to edit"
to write let's say the first student lock it so he is the only one able to edit on the final answer
sheet, if some other student in the session requested to write, well here the student 1 who locked
it first, needs to unlock it first and so the student two can lock and become the editor*/

// ── Lock consensus area ──────────────────────────────────────
router.put('/:sessionId/consensus/:exerciseId/lock', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role']
        if (userRole !== "student" && userRole !== "teacher") return res.status(403).json("Forbidden")

        const lockKey = `session:lock:${req.params.sessionId}:${req.params.exerciseId}`;
        // NX = only set if not exists, which means if the key already exists in cache then inserting it again is not allowed
        // it makes perfect sense since the lock cannot be hold by two students at the same time
        const acquired = await redis.set(lockKey, String(userId), 'NX', 'EX', 600); // auto-releases after 10 min with EX

        // const consensus = await ConsensusAnswerModel.findOne({
        //     sessionId: req.params.sessionId,
        //     exerciseId: Number(req.params.exerciseId)
        // });

        // if already locked by someone else
        // if (consensus?.lockedBy && consensus.lockedBy !== userId)
        //     return res.status(409).json({
        //         error: 'Consensus area is currently locked by another student',
        //         lockedBy: consensus.lockedBy
        //     });

        // await ConsensusAnswerModel.findOneAndUpdate(
        //     {
        //         sessionId: req.params.sessionId,
        //         exerciseId: Number(req.params.exerciseId)
        //     },
        //     { lockedBy: userId, lockedAt: new Date() },
        //     { upsert: true, returnDocument: 'after' } // again the upsert will create a document if it doesn't exist
        // );  --- using redis since it is faster for this case

        if (!acquired) {
            const currentHolder = await redis.get(lockKey);
            if (currentHolder !== String(userId)) {
                const lockedByEnriched = await resolveUser(currentHolder)
                return res.status(409).json({
                    error: 'Consensus area is currently locked by another student',
                    lockedBy: lockedByEnriched
                });
            }
        }
        //if not locked by someone else, the user takes the lead and we inform the others 
        const lockedUserEnriched = await resolveUser(userId)
        await emitToRoom(
            `session:${req.params.sessionId}`,
            'consensus:locked',
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId,
                lockedBy: lockedUserEnriched
            }
        );
        return res.status(200).json({ ok: true, lockedBy: lockedUserEnriched });
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Unlock consensus area ────────────────────────────────────
router.post('/:sessionId/consensus/:exerciseId/unlock', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);

        const lockKey = `session:lock:${req.params.sessionId}:${req.params.exerciseId}`;
        const currentHolder = await redis.get(lockKey);
        if (currentHolder === String(userId)) {
            await redis.del(lockKey); //we only delete the lock
        }

        // await ConsensusAnswerModel.findOneAndUpdate(
        //     {
        //         sessionId: req.params.sessionId,
        //         exerciseId: Number(req.params.exerciseId),
        //         lockedBy: userId         // only the locker can unlock
        //     },
        //     { lockedBy: null, lockedAt: null }
        // );

        const { text } = req.body || ""

        const updated = await ConsensusAnswerModel.findOneAndUpdate(
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId
            },
            {
                text,
                lastUpdatedBy: userId,
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: 'after' }
        );

        await emitToRoom(
            `session:${req.params.sessionId}`,
            'consensus:unlocked',
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId
            }
        );

        // we update as well
        await emitToRoom(
            `session:${req.params.sessionId}`,
            'consensus:updated',
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId,
                text
            }
        );

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Save + broadcast consensus text ─────────────────────────
router.put('/:sessionId/consensus/:exerciseId', async (req, res) => { // in the front we will set an infinte time interval that launch this let's say evey 15 seconds
    try {
        const userId = Number(req.headers['x-user-id']);

        const lockKey = `session:lock:${req.params.sessionId}:${req.params.exerciseId}`;
        const currentHolder = await redis.get(lockKey);
        if (currentHolder && currentHolder !== String(userId)) {
            return res.status(409).json({ error: 'You do not hold the lock' });
        }

        const consensus = await ConsensusAnswerModel.findOne({
            sessionId: req.params.sessionId,
            exerciseId: req.params.exerciseId
        });

        // only the student holding the lock can write
        // if (consensus?.lockedBy && consensus.lockedBy !== userId)
        //     return res.status(409).json({ error: 'You do not hold the lock' });

        const { text } = req.body;
        const updated = await ConsensusAnswerModel.findOneAndUpdate(
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId
            },
            {
                text,
                lastUpdatedBy: userId,
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: 'after' }
        );

        // broadcast to others so they see the text live
        const lockedUserEnriched = await resolveUser(userId)
        await emitToRoom(
            `session:${req.params.sessionId}`,
            'consensus:updated',
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId,
                text,
                updatedBy: lockedUserEnriched
            }
        );

        return res.status(200).json(updated);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Finalize consensus answer ────────────────────────────────
router.put('/:sessionId/consensus/:exerciseId/finalize', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);

        const updated = await ConsensusAnswerModel.findOneAndUpdate(
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId
            },
            {
                isFinal: true,
                finalizedAt: new Date(),
                lockedBy: null  // release lock on finalize
            },
            { returnDocument: 'after' }
        );

        if (!updated) return res.status(404).json({ error: 'Consensus not found' });

        await emitToRoom(
            `session:${req.params.sessionId}`,
            'consensus:finalized',
            {
                sessionId: req.params.sessionId,
                exerciseId: req.params.exerciseId,
                consensusId: updated._id,
                finalAnswer: updated.text
            }
        );

        await redis.del(`session:lock:${req.params.sessionId}:${req.params.exerciseId}`);//delte the key
        return res.status(200).json(updated);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

router.put('/:sessionId/consensus/:consensusId/grade', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json("Forbidden")

        const consensus = await ConsensusAnswerModel.findById(req.params.consensusId)
        if (!consensus) return res.status(404).json({ error: "consensus not found" })

        const session = await SessionModel.findById(consensus.sessionId)
        if (req.params.sessionId !== String(session._id)) return res.status(400).json({ error: "something is off, apparently the teacher isn't in the right session" })

        const classroom = await ClassroomModel.findById(session.classroomId)
        if (classroom.teacherId !== teacherId) return res.status(403).json("Forbidden")
        if (!consensus.finalizedAt) return res.status(400).json({ error: "the consensus isn't submitted yet by student" })

        const { grade, teacherRemark } = req.body
        consensus.grade = grade
        consensus.teacherRemark = teacherRemark
        consensus.gradedAt = new Date()
        await consensus.save()

        return res.status(200).json(consensus)

    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
})

// ── Get all consensus answers for a session ──────────────────
router.get('/:sessionId/consensus', async (req, res) => {
    try {
        const answers = await ConsensusAnswerModel.find({
            sessionId: req.params.sessionId
        });

        const enrichedConsensus = await Promise.all(
            answers.map(async (a) => {
                const lockKey = `session:lock:${req.params.sessionId}:${a.exerciseId}`;
                const currentHolder = await redis.get(lockKey);
                let lockedBy = null;
                if (currentHolder) lockedBy = await resolveUser(currentHolder)
                return {
                    ...a.toObject(),
                    lockedBy,
                }
            })
        )
        return res.status(200).json(enrichedConsensus);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// SESSION CHAT
// ─────────────────────────────────────────────────────────────

// ── Send message in session chat ────────────────────────────
router.post('/:sessionId/messages', async (req, res) => {
    try {
        const senderId = Number(req.headers['x-user-id']);
        const { message, quotedSheetId } = req.body;

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // chat only available in phase 2 and 3
        if (session.phase < 2)
            return res.status(403).json({ error: 'Chat is not available in phase 1' });

        const chat = await SessionChatModel.create({
            sessionId: session._id,
            senderId,
            message,
            readBy: [{ userId: senderId }]
        });

        const senderInfos = await resolveUser(senderId)
        const enrichedChat = {
            _id: chat._id,
            senderId: chat.senderId,
            message: chat.message,
            senderInfos,
            readBy: chat.readBy,
            sentAt: chat.createdAt
        }

        await emitToRoom(
            `session:${session._id}`,
            'session:new_message',
            { sessionId: session._id, message: enrichedChat }
        );

        return res.status(201).json(enrichedChat);
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Get session chat messages ────────────────────────────────
router.get('/:sessionId/messages', async (req, res) => {
    try {
        const messages = await SessionChatModel
            .find({ sessionId: req.params.sessionId })
            .sort({ createdAt: 1 })
            .lean()

        console.log('found messages:', messages.length, 'for sessionId:', req.params.sessionId)

        const enrichedMessages = await Promise.all(
            messages.map(async (m) => {
                const senderInfos = await resolveUser(m.senderId)
                return {
                    _id: m._id,
                    senderId: m.senderId,
                    message: m.message,
                    senderInfos,
                    readBy: m.readBy,
                    sentAt: m.createdAt
                }
            })
        )

        return res.status(200).json(enrichedMessages)
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message })
    }
});

// ─────────────────────────────────────────────────────────────
// TEACHER RESULTS VIEW
// ─────────────────────────────────────────────────────────────

// ── Teacher gets full session results ───────────────────────
router.get('/:sessionId/results', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);

        const session = await SessionModel.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const classroom = await ClassroomModel.findById(session.classroomId);
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Access denied' });

        const [sheets, consensus] = await Promise.all([
            IndividualSheetModel.find({ sessionId: session._id }),
            ConsensusAnswerModel.find({ sessionId: session._id })
        ]);

        // group sheets by exerciseId for easy reading
        const sheetsByExercise = sheets.reduce((acc, sheet) => {
            const key = String(sheet.exerciseId);
            if (!acc[key]) acc[key] = [];
            acc[key].push(sheet);
            return acc;
        }, {});

        const consensusByExercise = consensus.reduce((acc, c) => {
            acc[String(c.exerciseId)] = c;
            return acc;
        }, {});

        return res.status(200).json({
            session,
            results: {
                sheetsByExercise,
                consensusByExercise
            }
        });
    } catch (err) {
        console.log("error: ", err.message)
        res.status(500).json({ error: err.message });
    }
});

module.exports = router