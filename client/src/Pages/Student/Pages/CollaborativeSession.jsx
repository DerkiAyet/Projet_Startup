import React, { useEffect, useState, useMemo, useContext, useRef } from 'react'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import { ReactComponent as TargetIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg'
import { ReactComponent as TimerIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg'
import { ReactComponent as DoneIcon } from '../../../Assets/icons/CourseIcons/done-icon.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as CalcIcon } from '../../../Assets/icons/CourseIcons/calculator.svg'
import { ReactComponent as CodeIcon } from '../../../Assets/icons/CourseIcons/code.svg'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as ChatIcon } from '../../../Assets/icons/NavIcons/chats.svg';
import { ReactComponent as Phase1Icon } from '../../../Assets/icons/CourseIcons/essay.svg';
import { ReactComponent as Phase2Icon } from '../../../Assets/icons/CourseIcons/collaboration.svg';
import { ReactComponent as Phase3Icon } from '../../../Assets/icons/CourseIcons/together.svg';
import JoditEditor from "jodit-react"
import "../Styles/CollaborativeSession.css"
import SubmitAssignmentConfirm from '../Components/SubmitAssignmentConfirm'
import SubmitAssignmentSuccess from '../Components/SubmitAssignmentSucess'
import ToastMessage from '../../../Partials/Components/ToastMessage'
import Calculator from '../Components/Calculator'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import CodePanel from '../Components/CodeEditor'
import HeaderSession from '../Components/HeaderSession'
import { useSocket } from "../../../Utilities/config/useSocket"
import { AppContext } from '../../../App'
import startChat from '../../../Assets/images/chat.png'


// ─── Static data ────────────────────────────────────────────
const RECOMMENDATIONS = [
    { id: 1, thumb: "📐", thumbBg: "#FDF2F8", title: "Linear Algebra Basics", desc: "Vectors, matrices and transformations", level: "Beginner" },
    { id: 2, thumb: "📊", thumbBg: "#F0F9FF", title: "Statistics & Probability", desc: "Foundations of data analysis", level: "Intermediate" },
    { id: 3, thumb: "🔢", thumbBg: "#ECFDF5", title: "Number Theory", desc: "Primes, divisibility & congruences", level: "Advanced" },
    { id: 4, thumb: "📈", thumbBg: "#FFFBEB", title: "Differential Equations", desc: "Modeling with ODEs and PDEs", level: "Advanced" },
]

const LEVEL_COLOR = {
    Beginner: { color: "#10B981", bg: "#ECFDF5" },
    Intermediate: { color: "#F59E0B", bg: "#FFFBEB" },
    Advanced: { color: "#EC4899", bg: "#FDF2F8" },
}

// ─── Helpers ─────────────────────────────────────────────────
const initials = (name) =>
    (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const Avatar = ({ name, size, pic }) => (
    <div className="cs-avatar" style={size ? { '--sz': size } : {}}>
        {pic
            ? <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${pic}`} alt='user' />
            : <div className="cs-avatar-placeholder">{initials(name)}</div>}
    </div>
)

// ─── Phase badge helper ──────────────────────────────────────
const PHASE_META = {
    1: { label: "Phase 1 — Individual Work", color: "#F59E0B", bg: "#FFFBEB", icon: Phase1Icon },
    2: { label: "Phase 2 — Peer Discussion", color: "#3B82F6", bg: "#EFF6FF", icon: Phase2Icon },
    3: { label: "Phase 3 — Consensus Writing", color: "#10B981", bg: "#ECFDF5", icon: Phase3Icon },
}

// ─── Main component ──────────────────────────────────────────
function CollaborativeSession() {
    const { classroomId, sessionId } = useParams()
    const socket = useSocket()
    const { userAuth } = useContext(AppContext)

    // ── State ────────────────────────────────────────────────
    const [assignmentData, setAssignmentData] = useState({})
    const [classroomData, setClassroomData] = useState({})
    const [sessionData, setSessionData] = useState({})
    const [currentPhase, setCurrentPhase] = useState(1)
    const [studentsSheets, setStudentsSheets] = useState([])
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
    const [exercises, setExercises] = useState([])
    const [teacherInfo, setTeacherInfo] = useState({})
    const [consensusArea, setConsensusArea] = useState([])
    const [messages, setMessages] = useState([])
    const [mySheets, setMySheets] = useState([])       // student's own answer per exercise
    const [status, setStatus] = useState("")
    const [panelOpen, setPanelOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' })
    const [showModal, setShowModal] = useState(false)
    const [submittedWithSuccess, setSubmittedWithSuccess] = useState(false)
    const [showCalculator, setShowCalculator] = useState(false)
    const [showCodePanel, setShowCodePanel] = useState(false)

    const triggerToast = (message, subMessage = 'Just now') =>
        setToast({ visible: true, message, subMessage })

    // ── Socket join/leave ────────────────────────────────────
    useEffect(() => {
        if (!socket || !classroomId) return
        socket.emit('join_classroom', { classroomId })
        socket.emit('join_session', { sessionId })
        return () => {
            socket.emit('leave_classroom', { classroomId })
            socket.emit('leave_session', { sessionId })
        }
    }, [classroomId, sessionId, socket])

    // ── Initial data fetch ───────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [classRes, sessionRes, msgRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/messages`),
                ])

                setClassroomData(classRes.data)
                setTeacherInfo(classRes.data.creator)

                // Session response varies by phase (see backend)
                const rawSession = sessionRes.data?.session ?? sessionRes.data
                setSessionData(rawSession)
                const phase = rawSession.phase
                setCurrentPhase(phase)
                if (phase > 1) setPanelOpen(true)

                setMessages(msgRes.data)

                const assignmentId = rawSession.assignmentId
                if (assignmentId) {
                    try {
                        const assignRes = await axios.get(
                            `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/${assignmentId}`
                        )
                        const assignment = assignRes.data.assignment
                        setAssignmentData(assignment)
                        setStatus(assignRes.data.status)
                        const exs = assignment.exercises || []
                        setExercises(exs)

                        // Build empty answer sheets
                        const emptySheets = exs.map(ex => ({
                            sessionId,
                            studentId: userAuth.userId,
                            exerciseId: ex._id,
                            exerciseType: ex.exerciseType || "text",
                            answer: "",
                            mcqAnswers: (ex.questions || []).map(q => ({ questionId: q._id, selected: [] })),
                            localFile: null,
                            fileUrl: null,
                        }))

                        // If phase >= 2 load sheets
                        if (phase >= 2) {
                            try {
                                const sheetsRes = await axios.get(
                                    `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/sheets`
                                )
                                setStudentsSheets(sheetsRes.data)
                                // merge my own answers in
                                const myAnswers = sheetsRes.data
                                    .filter(s => String(s.studentId) === String(userAuth.userId))
                                if (myAnswers.length) {
                                    const merged = emptySheets.map(es => {
                                        const found = myAnswers.find(s => String(s.exerciseId) === String(es.exerciseId))
                                        return found ? { ...es, answer: found.answer, mcqAnswers: found.mcqAnswers ?? es.mcqAnswers } : es
                                    })
                                    setMySheets(merged)
                                } else {
                                    setMySheets(emptySheets)
                                }
                            } catch {
                                setMySheets(emptySheets)
                            }
                        } else {
                            setMySheets(emptySheets)
                        }

                        // Load consensus for phase 3
                        if (phase >= 3) {
                            try {
                                const consensusRes = await axios.get(
                                    `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus`
                                )
                                setConsensusArea(
                                    consensusRes.data.length
                                        ? consensusRes.data
                                        : exs.map(ex => ({
                                            sessionId,
                                            exerciseId: ex._id,
                                            exerciseType: ex.exerciseType || "text",
                                            text: "",
                                            isFinal: false,
                                            lockedBy: null,
                                        }))
                                )
                            } catch {
                                setConsensusArea(exs.map(ex => ({
                                    sessionId,
                                    exerciseId: ex._id,
                                    exerciseType: ex.exerciseType || "text",
                                    text: "",
                                    isFinal: false,
                                    lockedBy: null,
                                })))
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching assignment:", err)
                    }
                }
            } catch (err) {
                console.error("Error fetching session data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [classroomId, sessionId])

    const panelOpenRef = useRef(panelOpen)
    useEffect(() => { panelOpenRef.current = panelOpen }, [panelOpen]) // for the open panel issue when message is sent

    // ── Socket listeners ─────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        socket.on('session:phase_updated', ({ sessionId: sid, phase }) => {
            if (sid !== sessionId) return
            setCurrentPhase(phase)
            if (phase > 1) setPanelOpen(true)
            setSessionData(prev => ({ ...prev, phase }))
            triggerToast("Phase Advanced", `Now in Phase ${phase}`)
        })

        socket.on('session:student_submitted', ({ sessionId: sid, exerciseId, student, sheet }) => {
            if (sid !== sessionId) return
            setStudentsSheets(prev => {
                const exists = prev.find(s => String(s._id) === String(sheet._id))
                return exists ? prev.map(s => String(s._id) === String(sheet._id) ? sheet : s) : [...prev, sheet]
            })
            if (String(student.id) !== String(userAuth.userId)) {
                triggerToast("Student Submitted", `${student.givenName} ${student.familyName} submitted an answer`)
            }
        })

        socket.on('consensus:locked', ({ sessionId: sid, exerciseId, lockedBy }) => {
            if (sid !== sessionId) return
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(exerciseId) ? { ...c, lockedBy } : c
            ))
            console.log(lockedBy)
            triggerToast("Area Locked", `${lockedBy.givenName} ${lockedBy.familyName} is editing`)
        })

        socket.on('consensus:updated', ({ sessionId: sid, exerciseId, text }) => {
            if (sid !== sessionId) return
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(exerciseId) ? { ...c, text } : c
            ))
        })

        socket.on('consensus:unlocked', ({ sessionId: sid, exerciseId }) => {
            if (sid !== sessionId) return
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(exerciseId) ? { ...c, lockedBy: null } : c
            ))
            triggerToast("Area Unlocked", "Consensus area is free to lock")
        })

        socket.on('consensus:finalized', ({ sessionId: sid, exerciseId, finalAnswer }) => {
            if (sid !== sessionId) return
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(exerciseId) ? { ...c, text: finalAnswer, isFinal: true, lockedBy: null } : c
            ))
        })

        socket.on('session:new_message', ({ sessionId: sid, message }) => {
            if (sid !== sessionId) return
            setMessages(prev => [...prev, message])
            if (!panelOpenRef.current) triggerToast("New Message", "Check the latest conversations")
        })

        socket.on('session:completed', ({ sessionId: sid }) => {
            if (sid !== sessionId) return
            setSessionData(prev => ({ ...prev, isCompleted: true, completedAt: new Date() }))
        })

        return () => {
            socket.off('session:phase_updated')
            socket.off('session:student_submitted')
            socket.off('consensus:locked')
            socket.off('consensus:unlocked')
            socket.off('consensus:updated')
            socket.off('consensus:finalized')
            socket.off('session:new_message')
            socket.off('session:completed')
        }
    }, [socket, sessionId, userAuth.userId])

    // ── Derived ──────────────────────────────────────────────
    const currentExercise = exercises[currentExerciseIndex] || {}
    const currentMySheet = mySheets[currentExerciseIndex] || {}
    const currentConsensus = consensusArea.find(c => String(c.exerciseId) === String(currentExercise._id)) || {}

    const isTeacher = userAuth.role === "teacher"

    const lockedByMe = currentConsensus.lockedBy &&
        String(currentConsensus.lockedBy.id ?? currentConsensus.lockedBy) === String(userAuth.userId)
    const lockedByOther = currentConsensus.lockedBy && !lockedByMe

    // ── Answer helpers ───────────────────────────────────────
    const updateMySheet = (field, value) => {
        setMySheets(prev => {
            const next = [...prev]
            next[currentExerciseIndex] = { ...next[currentExerciseIndex], [field]: value }
            return next
        })
    }

    const updateConsensusText = (text) => {
        setConsensusArea(prev => prev.map(c =>
            String(c.exerciseId) === String(currentExercise._id) ? { ...c, text } : c
        ))
    }

    const toggleMCQOption = (questionId, optionText, allowMultiple) => {
        setMySheets(prev => {
            const next = [...prev]
            const sheet = { ...next[currentExerciseIndex] }
            const mcqAnswers = [...(sheet.mcqAnswers || [])]
            const idx = mcqAnswers.findIndex(a => a.questionId === questionId)
            if (idx === -1) return prev
            let selected = [...mcqAnswers[idx].selected]
            if (allowMultiple) {
                selected = selected.includes(optionText)
                    ? selected.filter(s => s !== optionText)
                    : [...selected, optionText]
            } else {
                selected = [optionText]
            }
            mcqAnswers[idx] = { ...mcqAnswers[idx], selected }
            sheet.mcqAnswers = mcqAnswers
            next[currentExerciseIndex] = sheet
            return next
        })
    }

    const goTo = (index) => {
        if (index >= 0 && index < exercises.length) setCurrentExerciseIndex(index)
    }

    // ── Progress ─────────────────────────────────────────────
    const progress = useMemo(() => {
        if (!mySheets.length) return 0
        const solved = mySheets.filter(p => {
            if (p.exerciseType === "mcq") return (p.mcqAnswers || []).some(a => a.selected?.length > 0)
            if (p.exerciseType === "file") return !!p.fileUrl || !!p.localFile
            return p.answer && p.answer.trim() !== ""
        }).length
        return Math.round((solved / mySheets.length) * 100)
    }, [mySheets])

    // ── API actions ──────────────────────────────────────────
    const handleSaveSheet = async () => {
        console.log(currentExercise._id)
        try {
            console.log(currentExercise._id)
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/sheets/${currentExercise._id}`,
                { answer: currentMySheet.answer, mcqAnswers: currentMySheet.mcqAnswers },
                { headers: { "Content-Type": "application/json" } }
            )
            triggerToast("Answer Saved", "Your draft has been saved")
        } catch {
            triggerToast("Error", "Failed to save your answer")
        }
    }

    const handleSubmitSheet = async () => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/sheets/${currentExercise._id}/submit`,
                { answer: currentMySheet.answer, mcqAnswers: currentMySheet.mcqAnswers },
                { headers: { "Content-Type": "application/json" } }
            )
            setShowModal(false)
            triggerToast("Answer Submitted", "Visible to peers in Phase 2")
        } catch {
            triggerToast("Error", "Failed to submit your answer")
        }
    }

    const lockConsensus = async () => {
        try {
            const res = await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus/${currentExercise._id}/lock`,
                {}, { headers: { "Content-Type": "application/json" } }
            )
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(currentExercise._id) ? { ...c, lockedBy: res.data.lockedBy } : c
            ))
        } catch (err) {
            const msg = err.response?.data?.error || "Failed to lock"
            triggerToast("Cannot Lock", msg)
        }
    }

    const unlockConsensus = async () => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus/${currentExercise._id}/unlock`,
                { text: currentConsensus.text }, { headers: { "Content-Type": "application/json" } }
            )
            setConsensusArea(prev => prev.map(c =>
                String(c.exerciseId) === String(currentExercise._id) ? { ...c, lockedBy: null } : c
            ))
        } catch {
            triggerToast("Error", "Failed to unlock")
        }
    }

    const saveConsensus = async () => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus/${currentExercise._id}`,
                { text: currentConsensus.text },
                { headers: { "Content-Type": "application/json" } }
            )
            triggerToast("Consensus Saved", "Draft saved successfully")
        } catch {
            triggerToast("Error", "Failed to save consensus")
        }
    }

    const finalizeConsensus = async () => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus/${currentExercise._id}/finalize`,
                { text: currentConsensus.text },
                { headers: { "Content-Type": "application/json" } }
            )
            triggerToast("Final Answer Submitted", "Your group's answer has been sent to the teacher")
        } catch {
            triggerToast("Error", "Failed to finalize consensus")
        }
    }

    const [gradeModal, setGradeModal] = useState(null) // { type: 'sheet'|'consensus', id, name }

    const handleGradeSheet = async (sheetId, grade, teacherRemark) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/sheets/${sheetId}/grade`,
                { grade, teacherRemark },
                { headers: { "Content-Type": "application/json" } }
            )
            triggerToast("Sheet Graded", "Grade saved successfully")
            setGradeModal(null)
        } catch {
            triggerToast("Error", "Failed to grade sheet")
        }
    }

    if (loading) {
        return (
            <div className="cs-loading">
                <div className="cs-loading-spinner" />
                <p>Loading session…</p>
            </div>
        )
    }

    const phaseMeta = PHASE_META[currentPhase] || PHASE_META[1]

    const handleGradeConsensus = async (consensusId, grade, teacherRemark) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/consensus/${consensusId}/grade`,
                { grade, teacherRemark },
                { headers: { "Content-Type": "application/json" } }
            )
            triggerToast("Consensus Graded", "Grade saved successfully")
            setGradeModal(null)
        } catch {
            triggerToast("Error", "Failed to grade consensus")
        }
    }

    return (
        <div className='cs-container cs-container'>
            <HeaderSession
                classroom={classroomData?.name}
                classroomId={classroomId}
                sessionId={sessionId}
                title={assignmentData?.title}
                creatorName={`${teacherInfo.givenName || ''} ${teacherInfo.familyName || ''}`}
                phase={currentPhase}
            />

            {/* Phase banner */}
            <div className="cs-phase-banner" style={{ background: phaseMeta.bg, borderColor: phaseMeta.color + '40' }}>
                <span className="cs-phase-icon"><phaseMeta.icon /></span>
                <span className="cs-phase-label" style={{ color: phaseMeta.color }}>{phaseMeta.label}</span>
                {sessionData.isCompleted && (
                    <span className="cs-completed-badge">✓ Session Completed</span>
                )}
                {
                    currentPhase > 1 &&
                    <button className="cs-btn cs-btn--ghost" style={{ marginLeft: "auto" }} onClick={() => setPanelOpen(true)}>
                        <ChatIcon style={{ height: "20px", width: "20px" }} /> Open Chat
                    </button>
                }
            </div>

            <div className="as-main">
                {/* ── LEFT: exercise area ──────────────────── */}
                <div className="solution-sheet left-side">
                    <div className="lesson-editor-container">

                        {/* Navigation bar */}
                        <div className="lesson-nav-bar">
                            <button
                                className="lesson-nav-btn"
                                disabled={currentExerciseIndex === 0}
                                onClick={() => goTo(currentExerciseIndex - 1)}
                            >
                                <BackIcon className="lesson-icon" /> Previous
                            </button>
                            <div className="lesson-nav-info">
                                <span className="lesson-counter">
                                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                                </span>
                                <div className="lesson-title-input">
                                    {exercises[currentExerciseIndex]?.title || "Untitled Exercise"}
                                </div>
                            </div>
                            <button
                                className="lesson-nav-btn lesson-nav-btn--next"
                                disabled={currentExerciseIndex === exercises.length - 1}
                                onClick={() => goTo(currentExerciseIndex + 1)}
                            >
                                Next <BackIcon className="lesson-icon rotate-180" />
                            </button>
                        </div>

                        {/* Points + type badge */}
                        <div className="cs-exercise-meta">
                            <span className="cs-meta-label">Points</span>
                            <div className="points-box">
                                {currentExercise?.exerciseType === "mcq"
                                    ? `${(currentExercise.questions || []).reduce((s, q) => s + (q.points || 1), 0)} pts`
                                    : `${currentExercise?.points || 0} pts`}
                            </div>
                            <div className={`cs-type-badge cs-type-badge--${currentExercise?.exerciseType || 'text'}`}>
                                {currentExercise?.exerciseType === "mcq" ? "MCQ"
                                    : currentExercise?.exerciseType === "file" ? "File" : "Text"}
                            </div>
                        </div>

                        {/* ── Exercise statement ─────────────────── */}
                        <ExerciseStatement
                            exercise={currentExercise}
                            exerciseIndex={currentExerciseIndex}
                            mySheet={currentMySheet}
                            status={status}
                            currentPhase={currentPhase}
                            toggleMCQOption={toggleMCQOption}
                        />

                        {/* ══════════════════════════════════════════
                            PHASE 1 — Individual answer area
                        ══════════════════════════════════════════ */}
                        {currentPhase === 1 && !isTeacher && (
                            <Phase1AnswerArea
                                exercise={currentExercise}
                                exerciseIndex={currentExerciseIndex}
                                mySheet={currentMySheet}
                                status={status}
                                updateMySheet={updateMySheet}
                                toggleMCQOption={toggleMCQOption}
                                onSave={handleSaveSheet}
                                onSubmit={() => setShowModal(true)}
                            />
                        )}

                        {/* ══════════════════════════════════════════
                            PHASE 2 — All students' answers visible
                        ══════════════════════════════════════════ */}
                        {currentPhase === 2 && (
                            <Phase2SheetsView
                                exercise={currentExercise}
                                studentsSheets={studentsSheets}
                                mySheet={currentMySheet}
                                updateMySheet={updateMySheet}
                                onSave={handleSaveSheet}
                                onSubmit={() => setShowModal(true)}
                                isTeacher={isTeacher}
                                userAuth={userAuth}
                                onGradeSheet={(sheetId, name) => setGradeModal({ type: 'sheet', id: sheetId, name })}
                            />
                        )}

                        {/* ══════════════════════════════════════════
                            PHASE 3 — Consensus writing
                        ══════════════════════════════════════════ */}
                        {currentPhase === 3 && (
                            <Phase3ConsensusArea
                                exercise={currentExercise}
                                exerciseIndex={currentExerciseIndex}
                                consensus={currentConsensus}
                                studentsSheets={studentsSheets}
                                isTeacher={isTeacher}
                                lockedByMe={lockedByMe}
                                lockedByOther={lockedByOther}
                                updateConsensusText={updateConsensusText}
                                onLock={lockConsensus}
                                onUnlock={unlockConsensus}
                                onSave={saveConsensus}
                                onFinalize={finalizeConsensus}
                                userAuth={userAuth}
                                onGradeConsensus={(consensusId) => setGradeModal({ type: 'consensus', id: consensusId, name: 'Group Consensus' })}
                            />
                        )}

                        {gradeModal && (
                            <GradeModal
                                target={gradeModal}
                                onClose={() => setGradeModal(null)}
                                onConfirm={(grade, remark) =>
                                    gradeModal.type === 'sheet'
                                        ? handleGradeSheet(gradeModal.id, grade, remark)
                                        : handleGradeConsensus(gradeModal.id, grade, remark)
                                }
                            />
                        )}

                        {/* ── Progress dots ──────────────────────── */}
                        <div className="lesson-editor-actions">
                            <div className="lesson-editor-actions-right">
                                <span className="lesson-dots">
                                    {exercises.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`lesson-dot ${i === currentExerciseIndex ? "lesson-dot--active" : ""}`}
                                            onClick={() => goTo(i)}
                                        />
                                    ))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: sidebar ───────────────────────── */}
                <aside className="cd-sidebar">
                    {/* Assignment details */}
                    <div className="cd-sidebar-card">
                        <div className="cd-sidebar-card-header">
                            <h4 className="cd-sidebar-card-title">Assignment Details</h4>
                        </div>
                        <p className="cd-course-title-text">{assignmentData.title}</p>
                        <div className="cd-teacher-row">
                            <div className="cd-teacher-avatar" style={{ background: "#EC489922", color: "#EC4899" }}>
                                {`${teacherInfo?.familyName?.charAt(0).toUpperCase() || ''}${teacherInfo?.givenName?.charAt(0).toUpperCase() || ''}`}
                            </div>
                            <div>
                                <p className="cd-teacher-label">Instructor</p>
                                <p className="cd-teacher-name">Dr. {teacherInfo?.givenName} {teacherInfo?.familyName}</p>
                            </div>
                        </div>
                        <div className="cd-details-grid">
                            <div className="cd-detail-item">
                                <LessonIcon className="detail-item-icon" />
                                <div>
                                    <p className="cd-detail-label">Exercises</p>
                                    <p className="cd-detail-val">{exercises.length}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <TimerIcon />
                                <div>
                                    <p className="cd-detail-label">Phase</p>
                                    <p className="cd-detail-val"
                                        style={{ color: phaseMeta.color }}>
                                        {currentPhase} / 3
                                    </p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <TargetIcon />
                                <div>
                                    <p className="cd-detail-label">Level</p>
                                    <p className="cd-detail-val">{assignmentData.level || '—'}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <DoneIcon />
                                <div>
                                    <p className="cd-detail-label">Students</p>
                                    <p className="cd-detail-val">
                                        {[...new Set(studentsSheets.map(s => s.studentId))].length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="cd-tags">
                            <span className="cd-tag">{assignmentData?.category?.name}</span>
                            <span className="cd-tag">{assignmentData?.subCategory?.name}</span>
                        </div>
                    </div>

                    {/* Exercise list */}
                    <div className="cd-sidebar-card">
                        <h4 className="cd-sidebar-card-title">Exercises</h4>
                        <div className="cd-lesson-list">
                            {exercises.map((e, i) => (
                                <button
                                    key={e._id || i}
                                    className={`cd-lesson-list-item ${i === currentExerciseIndex ? "cd-lesson-list-item--active" : ""}`}
                                    onClick={() => goTo(i)}
                                >
                                    <span className="cd-lesson-num">{i + 1}</span>
                                    <span className="cd-lesson-list-title">{e.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phase 2: open chat button */}
                    {currentPhase >= 2 && (
                        <button
                            className="cs-open-chat-btn"
                            onClick={() => setPanelOpen(true)}
                        >
                            <i className="ri-chat-3-line" />
                            Open Discussion
                            {messages.length > 0 && (
                                <span className="cs-chat-badge">{messages.length}</span>
                            )}
                        </button>
                    )}

                    {/* Recommendations */}
                    <div className="cd-sidebar-card">
                        <h4 className="cd-sidebar-card-title">You may also like</h4>
                        <div className="cd-rec-list">
                            {RECOMMENDATIONS.map((r) => {
                                const lc = LEVEL_COLOR[r.level]
                                return (
                                    <div className="cd-rec-item" key={r.id}>
                                        <div className="cd-rec-thumb" style={{ background: r.thumbBg }}>{r.thumb}</div>
                                        <div className="cd-rec-info">
                                            <p className="cd-rec-title">{r.title}</p>
                                            <p className="cd-rec-desc">{r.desc}</p>
                                            <span className="cd-rec-level" style={{ color: lc.color, background: lc.bg }}>{r.level}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </aside>

                {/* Tool buttons */}
                <div className="tool-btns-wrapper">
                    <button onClick={() => setShowCodePanel(true)}>
                        <CodeIcon className="tool-icon" />
                    </button>
                    <button onClick={() => setShowCalculator(true)}>
                        <CalcIcon className="tool-icon" />
                    </button>
                </div>
            </div>

            {/* Modals & overlays */}
            {showModal && (
                <SubmitAssignmentConfirm
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={handleSubmitSheet}
                    assignmentData={assignmentData}
                    exercises={exercises}
                    problemsSolved={mySheets}
                />
            )}
            {submittedWithSuccess && (
                <SubmitAssignmentSuccess
                    assignmentTitle={assignmentData.title}
                    onClose={() => setSubmittedWithSuccess(false)}
                />
            )}
            {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
            <CodePanel isOpen={showCodePanel} onClose={() => setShowCodePanel(false)} />
            <ToastMessage
                visible={toast.visible}
                message={toast.message}
                subMessage={toast.subMessage}
                onClose={() => setToast(t => ({ ...t, visible: false }))}
            />
            <MessagesPanel
                messages={messages}
                messagesOpen={panelOpen}
                sessionId={sessionId}
                classroomName={classroomData?.name || ''}
                author={classroomData?.creator?.id}
                onClose={() => setPanelOpen(false)}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Renders the exercise statement (read-only) */
function ExerciseStatement({ exercise, exerciseIndex, mySheet, status, currentPhase, toggleMCQOption }) {
    if (!exercise._id) return null

    return (
        <div className="exercise-statement-box">
            {/* TEXT */}
            {(exercise.exerciseType === "text" || !exercise.exerciseType) && (
                <div className="as-exercise-card">
                    <div className="as-page-number">Exercise {exerciseIndex + 1}</div>
                    <div className="as-page-content" dangerouslySetInnerHTML={{ __html: exercise.content }} />
                </div>
            )}

            {/* FILE */}
            {exercise.exerciseType === "file" && (
                <div className="as-exercise-card">
                    <div className="as-page-number">Exercise {exerciseIndex + 1}</div>
                    {exercise.fileUrl ? (
                        exercise.fileUrl.toLowerCase().endsWith(".pdf") ? (
                            <iframe
                                src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${exercise.fileUrl}`}
                                title={exercise.title}
                                style={{ width: "100%", height: "400px", border: "none", borderRadius: "10px" }}
                            />
                        ) : (
                            <img
                                src={`${process.env.REACT_APP_API_URL_GATEWAY}/${exercise.fileUrl}`}
                                alt={exercise.title}
                                style={{ width: "100%", borderRadius: "10px", objectFit: "contain" }}
                            />
                        )
                    ) : (
                        <p className="cs-empty-text">No file attached to this exercise.</p>
                    )}
                </div>
            )}

            {/* MCQ — statement only (options handled per-phase) */}
            {exercise.exerciseType === "mcq" && (
                <div className="as-exercise-card">
                    <div className="as-page-number">Exercise {exerciseIndex + 1} — MCQ</div>
                    <p className="cs-mcq-intro">{exercise.content || "Answer the questions below."}</p>
                </div>
            )}
        </div>
    )
}

/** Phase 1 — student writes their own answer */
function Phase1AnswerArea({ exercise, exerciseIndex, mySheet, status, updateMySheet, toggleMCQOption, onSave, onSubmit }) {
    const isGraded = status === "graded"

    return (
        <div className="cs-answer-area">
            <div className="cs-section-label">
                <span className="cs-section-dot cs-dot-yellow" />
                Your Answer — Phase 1
            </div>

            {/* TEXT / FILE type */}
            {(exercise.exerciseType === "text" || exercise.exerciseType === "file" || !exercise.exerciseType) && !isGraded && (
                <>
                    {/* File upload */}
                    <FileUploadSlot
                        mySheet={mySheet}
                        updateMySheet={updateMySheet}
                        accentColor={exercise.exerciseType === "file" ? "#10B981" : "#EC4899"}
                        accentBg={exercise.exerciseType === "file" ? "#ECFDF5" : "#FDF2F8"}
                    />

                    {/* Rich text editor */}
                    <JoditEditor
                        key={`p1-${exerciseIndex}`}
                        value={mySheet?.answer || ""}
                        onBlur={(val) => updateMySheet("answer", val)}
                        config={{ uploader: { insertImageAsBase64URI: true } }}
                    />
                </>
            )}

            {/* MCQ type */}
            {exercise.exerciseType === "mcq" && !isGraded && (
                <MCQAnswerBlock
                    exercise={exercise}
                    mySheet={mySheet}
                    toggleMCQOption={toggleMCQOption}
                    readonly={false}
                />
            )}

            {/* If graded, show teacher's remark */}
            {isGraded && (
                <div className="as-exercise-card" style={{ border: "1.5px solid #EC489980", background: "#FDF2F8" }}>
                    <div className="as-page-number">Teacher's Remark</div>
                    <div className="as-page-content" dangerouslySetInnerHTML={{ __html: mySheet?.teacherExplanation }} />
                </div>
            )}

            {/* Action buttons */}
            {!isGraded && (
                <div className="cs-action-row">
                    <button className="cs-btn cs-btn--ghost" onClick={onSave}>
                        <i className="ri-save-line" /> Save Draft
                    </button>
                    <button className="cs-btn cs-btn--primary" onClick={onSubmit}>
                        <i className="ri-send-plane-line" /> Submit Answer
                    </button>
                </div>
            )}
        </div>
    )
}

/** Phase 2 — see all students' answers + own answer still editable */
function Phase2SheetsView({ exercise, studentsSheets, mySheet, updateMySheet, onSave, onSubmit, isTeacher, userAuth, onGradeSheet }) {
    const exerciseSheets = studentsSheets.filter(
        s => String(s.exerciseId) === String(exercise._id) && s.submittedAt
    )

    return (
        <div className="cs-answer-area">
            {/* My answer (editable if not yet submitted) */}
            {!isTeacher && (
                <div className="cs-subsection">
                    <div className="cs-section-label">
                        <span className="cs-section-dot cs-dot-blue" />
                        Your Answer
                    </div>
                    {(exercise.exerciseType === "text" || exercise.exerciseType === "file" || !exercise.exerciseType) && (
                        <>
                            <FileUploadSlot mySheet={mySheet} updateMySheet={updateMySheet} />
                            <JoditEditor
                                key={`p2-my-${exercise._id}`}
                                value={mySheet?.answer || ""}
                                onBlur={(val) => updateMySheet("answer", val)}
                                config={{ uploader: { insertImageAsBase64URI: true } }}
                            />
                        </>
                    )}
                    {exercise.exerciseType === "mcq" && (
                        <MCQAnswerBlock exercise={exercise} mySheet={mySheet} toggleMCQOption={() => { }} readonly={true} />
                    )}
                    <div className="cs-action-row">
                        <button className="cs-btn cs-btn--ghost" onClick={onSave}>
                            <i className="ri-save-line" /> Save Draft
                        </button>
                        <button className="cs-btn cs-btn--primary" onClick={onSubmit}>
                            <i className="ri-send-plane-line" /> Submit Answer
                        </button>
                    </div>
                </div>
            )}

            {/* All submitted sheets */}
            <div className="cs-subsection">
                <div className="cs-section-label">
                    <span className="cs-section-dot cs-dot-blue" />
                    {isTeacher ? `All Answers (${exerciseSheets.length})` : `Classmates' Answers (${exerciseSheets.length})`}
                </div>
                {exerciseSheets.length === 0 ? (
                    <div className="cs-empty-state"><span>No answers submitted yet.</span></div>
                ) : (
                    <div className="cs-sheets-list">
                        {exerciseSheets.map((sheet, i) => {
                            const isOwn = String(sheet.studentId) === String(userAuth.userId)
                            const name = sheet.student
                                ? `${sheet.student.givenName} ${sheet.student.familyName}`
                                : `Student ${i + 1}`
                            return (
                                <div key={sheet._id || i} className={`cs-sheet-card ${isOwn ? 'cs-sheet-card--own' : ''}`}>
                                    <div className="cs-sheet-header">
                                        <Avatar name={isOwn ? "M E" : name} pic={sheet.student?.userImg} size="32px" />
                                        <span className="cs-sheet-name">{isOwn ? "You" : name}</span>
                                        <span className="cs-sheet-time">
                                            {sheet.submittedAt
                                                ? new Date(sheet.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : ''}
                                        </span>
                                        {/* Grade badge if already graded */}
                                        {sheet.grade != null && (
                                            <span className="cs-grade-badge">{sheet.grade} pts</span>
                                        )}
                                        {/* Grade button for teacher */}
                                        {isTeacher && (
                                            <button
                                                className="cs-btn cs-btn--ghost cs-btn--sm"
                                                onClick={() => onGradeSheet(sheet._id, name)}
                                            >
                                                <i className="ri-quill-pen-line" />
                                                {sheet.grade != null ? 'Edit Grade' : 'Grade'}
                                            </button>
                                        )}
                                    </div>
                                    <div
                                        className="cs-sheet-content as-page-content"
                                        dangerouslySetInnerHTML={{ __html: sheet.answer || '<em>No text answer</em>' }}
                                    />
                                    {/* Show existing remark if graded */}
                                    {isTeacher && sheet.teacherRemark && (
                                        <div className="cs-remark-preview">
                                            <i className="ri-feedback-line" /> {sheet.teacherRemark}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

/** Phase 3 — consensus writing block */
function Phase3ConsensusArea({
    exercise, exerciseIndex, consensus, studentsSheets,
    isTeacher, lockedByMe, lockedByOther,
    updateConsensusText, onLock, onUnlock, onSave, onFinalize, userAuth, onGradeConsensus
}) {
    const exerciseSheets = studentsSheets.filter(
        s => String(s.exerciseId) === String(exercise._id) && s.submittedAt
    )

    useEffect(() => {
        if (!lockedByMe) return
        const interval = setInterval(() => {
            onSave()
        }, 10000)
        return () => clearInterval(interval)
    }, [lockedByMe, onSave])

    return (
        <div className="cs-answer-area">
            {/* Reference: individual answers (collapsible) */}
            <details className="cs-reference-details">
                <summary className="cs-reference-summary">
                    <span className="cs-section-dot cs-dot-blue" />
                    View Individual Answers ({exerciseSheets.length})
                </summary>
                <div className="cs-sheets-list cs-sheets-list--compact">
                    {exerciseSheets.map((sheet, i) => {
                        const name = sheet.student
                            ? `${sheet.student.givenName} ${sheet.student.familyName}`
                            : `Student ${i + 1}`
                        return (
                            <div key={sheet._id || i} className="cs-sheet-card cs-sheet-card--sm">
                                <div className="cs-sheet-header">
                                    <Avatar name={name} pic={sheet.student?.userImg} size="26px" />
                                    <span className="cs-sheet-name">{name}</span>
                                </div>
                                <div
                                    className="cs-sheet-content as-page-content"
                                    dangerouslySetInnerHTML={{ __html: sheet.answer || '<em>No text answer</em>' }}
                                />
                            </div>
                        )
                    })}
                </div>
            </details>

            {/* Consensus editor */}
            <div className="cs-consensus-block">
                <div className="cs-section-label">
                    <span className="cs-section-dot cs-dot-green" />
                    Group Consensus Answer
                    {consensus.isFinal && (
                        <span className="cs-final-badge">✓ Final</span>
                    )}
                </div>

                {/* Lock status bar */}
                {!consensus.isFinal && (
                    <div className={`cs-lock-bar ${lockedByMe ? 'cs-lock-bar--mine' : lockedByOther ? 'cs-lock-bar--other' : 'cs-lock-bar--free'}`}>
                        {lockedByMe && (
                            <>
                                <span>🔒 You are editing</span>
                                <button className="cs-lock-action cs-lock-action--unlock" onClick={onUnlock}>
                                    Release Lock
                                </button>
                            </>
                        )}
                        {lockedByOther && (
                            <>
                                <span>
                                    🔒 {consensus.lockedBy?.givenName} {consensus.lockedBy?.familyName} is editing
                                </span>
                            </>
                        )}
                        {!lockedByMe && !lockedByOther && !isTeacher && (
                            <>
                                <span>🔓 Area is free — lock to edit</span>
                                <button className="cs-lock-action cs-lock-action--lock" onClick={onLock}>
                                    Lock &amp; Edit
                                </button>
                            </>
                        )}
                        {isTeacher && !lockedByMe && !lockedByOther && (
                            <span>Waiting for a student to lock the area</span>
                        )}
                    </div>
                )}

                {/* Editor */}
                {!consensus.isFinal ? (
                    <JoditEditor
                        key={`consensus-${exercise._id}`}
                        value={consensus.text || ""}
                        onBlur={(val) => {
                            if (lockedByMe) updateConsensusText(val)
                        }}
                        config={{
                            uploader: { insertImageAsBase64URI: true },
                            readonly: !lockedByMe,
                            toolbar: lockedByMe,
                        }}
                    />
                ) : (
                    <div className="as-exercise-card" style={{ border: "1.5px solid #10B98150", background: "#ECFDF5" }}>
                        <div className="as-page-number">Final Consensus</div>
                        <div className="as-page-content" dangerouslySetInnerHTML={{ __html: consensus.text }} />
                    </div>
                )}

                {/* Actions */}
                {!consensus.isFinal && lockedByMe && (
                    <div className="cs-action-row">
                        <button className="cs-btn cs-btn--ghost" onClick={onSave}>
                            <i className="ri-save-line" /> Save Draft
                        </button>
                        <button className="cs-btn cs-btn--success" onClick={onFinalize}>
                            <i className="ri-check-double-line" /> Submit Final Answer
                        </button>
                    </div>
                )}
                {isTeacher && consensus.isFinal && (
                    <div className="cs-action-row">
                        {consensus.grade != null && (
                            <span className="cs-grade-badge">{consensus.grade} pts</span>
                        )}
                        <button
                            className="cs-btn cs-btn--primary"
                            onClick={() => onGradeConsensus(consensus._id)}
                        >
                            <i className="ri-quill-pen-line" />
                            {consensus.grade != null ? 'Edit Grade' : 'Grade Consensus'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

/** File upload slot (reused) */
function FileUploadSlot({ mySheet, updateMySheet, accentColor = "#EC4899", accentBg = "#FDF2F8" }) {
    if (mySheet?.localFile || mySheet?.fileUrl) {
        return (
            <div className="cs-file-chip" style={{ borderColor: accentColor + '80', background: accentBg }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
                <span style={{ color: accentColor }}>{mySheet.localFile?.name || "Uploaded file"}</span>
                <button onClick={() => updateMySheet("localFile", null)} style={{ color: accentColor }}>Remove</button>
            </div>
        )
    }
    return (
        <label className="cs-file-drop">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Click to upload a PDF or image</span>
            <input type="file" accept=".pdf,image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files[0]; if (f) updateMySheet("localFile", f) }} />
        </label>
    )
}

/** MCQ answer block */
function MCQAnswerBlock({ exercise, mySheet, toggleMCQOption, readonly }) {
    return (
        <div className="cs-mcq-block">
            {(exercise.questions || []).map((q, qIdx) => {
                const ans = (mySheet?.mcqAnswers || []).find(a => a.questionId === q._id)
                const selected = ans?.selected || []
                return (
                    <div className="as-exercise-card" key={qIdx}>
                        <div className="as-page-number">{q.points || 1} pt{q.points !== 1 ? "s" : ""}</div>
                        <p className="cs-question-text">{qIdx + 1}. {q.questionContent}</p>
                        {q.allowMultiple && (
                            <p className="cs-multiple-hint">Multiple answers allowed</p>
                        )}
                        <div className="cs-options-list">
                            {(q.options || []).map((opt, oIdx) => {
                                const isSelected = selected.includes(opt.text)
                                return (
                                    <div
                                        key={oIdx}
                                        className={`mcq-solve-option ${isSelected ? "mcq-solve-option--selected" : ""} ${readonly ? "mcq-solve-option--readonly" : ""}`}
                                        onClick={() => !readonly && toggleMCQOption(q._id, opt.text, q.allowMultiple)}
                                    >
                                        <div className={`mcq-solve-indicator ${q.allowMultiple ? "mcq-solve-indicator--checkbox" : "mcq-solve-indicator--radio"} ${isSelected ? "mcq-solve-indicator--active" : ""}`}>
                                            {isSelected && (q.allowMultiple
                                                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                : <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
                                            )}
                                        </div>
                                        <span className="cs-option-text">{opt.text}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="cs-mcq-progress">
                            {selected.length} / {(q.options || []).length} selected
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function GradeModal({ target, onClose, onConfirm }) {
    const [grade, setGrade] = useState('')
    const [remark, setRemark] = useState('')

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-icon-ring">
                    <i className="ri-quill-pen-line" style={{ fontSize: '1.4rem', color: '#EC4899' }} />
                </div>
                <p className="modal-title" style={{ marginTop: '0.75rem' }}>Grade — {target.name}</p>
                <p className="modal-desc">Assign a score and leave an optional remark.</p>

                <div className="modal-meta" style={{ gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Score
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="e.g. 18"
                            value={grade}
                            onChange={e => setGrade(e.target.value)}
                            style={{
                                padding: '0.5rem 0.75rem', borderRadius: '8px',
                                border: '1.5px solid #D9E1E7', fontFamily: 'Nunito, sans-serif',
                                fontSize: '0.95rem', outline: 'none', width: '100%'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Remark (optional)
                        </label>
                        <textarea
                            placeholder="Leave feedback for the student…"
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            rows={3}
                            style={{
                                padding: '0.5rem 0.75rem', borderRadius: '8px',
                                border: '1.5px solid #D9E1E7', fontFamily: 'Nunito, sans-serif',
                                fontSize: '0.92rem', outline: 'none', resize: 'none', width: '100%'
                            }}
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-confirm"
                        disabled={grade === ''}
                        onClick={() => onConfirm(Number(grade), remark)}
                    >
                        Save Grade
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// MESSAGES PANEL
// ─────────────────────────────────────────────────────────────
const MessagesPanel = ({ messages, sessionId, messagesOpen, classroomName, author, onClose }) => {
    const { userAuth } = useContext(AppContext)
    const messagesEndRef = useRef(null)
    const [inputVal, setInputVal] = useState('')

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!inputVal.trim()) return
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/messages`,
                { message: inputVal.trim() },
                { headers: { "Content-Type": "application/json" } }
            )
            setInputVal('')
        } catch (err) {
            console.error("Error sending message", err)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className={`messages-area ${messagesOpen ? "messages-area-open" : ""}`}>
            <div className="header-messages">
                <div className="c-infos" style={{ backgroundColor: "transparent" }}>
                    <div className="cs-avatar">
                        <div className="cs-avatar-placeholder">{(classroomName || ' ').charAt(0).toUpperCase()}</div>
                    </div>
                    <div className="c-infos-info">
                        <div className="c-infos-name">{classroomName}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8E8E8E" }}>Session Discussion</div>
                    </div>
                    <div className="c-infos-actions">
                        <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
                    </div>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className='empty-chat-side'>
                    <div className="empty-panel-wrap">
                        <img src={startChat} alt="start chat" style={{ height: "90px" }} />
                        <h3>Start the group discussion!</h3>
                    </div>
                </div>
            ) : (
                <div className="messages-body">
                    {messages.map((msg, idx) => {
                        const isSent = String(msg.senderId) === String(userAuth.userId)
                        const senderName = `${msg.senderInfos?.givenName ?? ''} ${msg.senderInfos?.familyName ?? ''}`
                        const senderPic = msg.senderInfos?.userImg

                        return (
                            <div key={msg._id || idx} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                                {!isSent && (
                                    <div className="msg-avatar-wrap">
                                        <Avatar name={senderName} pic={senderPic} />
                                        <span className="msg-sender-name">
                                            {String(author) === String(msg.senderId) ? "Teacher" : (msg.senderInfos?.givenName ?? '')}
                                        </span>
                                    </div>
                                )}
                                <div className="bubble">
                                    {msg.message}
                                    <div className="bubble-meta">
                                        <span className="bubble-time">
                                            {new Date(msg.sentAt ?? msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isSent && (
                                            <span className="read-ticks">{msg.readBy?.length > 1 ? '✓✓' : '✓'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}

            <div className="chat-input-bar">
                <div className="chat-input-wrap">
                    <button className="input-icon-btn"><i className="bx bx-smile" /></button>
                    <textarea
                        placeholder="Type a message…"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        style={{ resize: "none" }}
                    />
                    <button className="input-icon-btn"><i className="ri-attachment-2" /></button>
                </div>
                <button className="send-btn" onClick={sendMessage}>
                    <i className="ri-send-plane-fill" />
                </button>
            </div>
        </div>
    )
}

export default CollaborativeSession