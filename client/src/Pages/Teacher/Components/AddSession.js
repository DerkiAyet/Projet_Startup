import React, { useState, useEffect } from 'react'
import '../Styles/AddSession.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios'
import { useParams } from 'react-router-dom'


const AssignmentPopup = ({ items, loading, onSelect, onClose }) => (
    <motion.div
        className="session-content-popup"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
    >
        <div className="session-popup-header">
            <span>Select an assignment</span>
            <button type="button" className="session-popup-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="session-popup-list">
            {loading ? (
                <div className="session-popup-loading">
                    <div className="loading-spinner" />
                    <span>Loading assignments...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="session-popup-empty">No assignments found</div>
            ) : (
                items.map(item => (
                    <div key={item._id} className="session-popup-item" onClick={() => onSelect(item)}>
                        <div className="session-popup-thumb">
                            {item.thumbnail
                                ? <img src={item.thumbnail} alt={item.title} />
                                : <div className="session-popup-thumb-fallback">{item.title?.charAt(0)}</div>
                            }
                        </div>
                        <div className="session-popup-info">
                            <span className="session-popup-title">{item.title}</span>
                            <div className="session-popup-meta">
                                {item.category?.name && (
                                    <span className="session-popup-badge">{item.category.name}</span>
                                )}
                                {item.level && (
                                    <span className="session-popup-level">{item.level}</span>
                                )}
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line session-popup-arrow" />
                    </div>
                ))
            )}
        </div>
    </motion.div>
)

export const AddSessionForm = ({ onClose }) => {
    const { classroomId } = useParams()

    const [payload, setPayload] = useState({
        assignmentId: "",
        refTitle: "",
        refThumbnail: "",
        refCategory: {},
        deadline: "",
        phaseDurations: { phase1: 20, phase2: 20, phase3: 20 }
    })
    const [errors, setErrors] = useState({ assignment: "" })
    const [loading, setLoading] = useState(false)
    const [assignments, setAssignments] = useState([])
    const [assignmentsLoading, setAssignmentsLoading] = useState(false)
    const [showPopup, setShowPopup] = useState(false)

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            setAssignmentsLoading(true)
            const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/teacher-assigns`)
            setAssignments(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setAssignmentsLoading(false)
        }
    }

    const handleSelectAssignment = (item) => {
        setPayload(prev => ({
            ...prev,
            assignmentId: item._id,
            refTitle: item.title,
            refThumbnail: item.thumbnail || "",
            refCategory: item.category || {}
        }))
        setErrors(p => ({ ...p, assignment: "" }))
        setShowPopup(false)
    }

    const handleDurationChange = (phase, value) => {
        const num = Math.max(1, Math.min(120, Number(value) || 1))
        setPayload(prev => ({
            ...prev,
            phaseDurations: { ...prev.phaseDurations, [phase]: num }
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = {}
        if (!payload.assignmentId) newErrors.assignment = "Please select an assignment"
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

        try {
            setLoading(true)
            const body = {
                assignmentId: payload.assignmentId,
                refTitle: payload.refTitle,
                refThumbnail: payload.refThumbnail,
                refCategory: payload.refCategory,
                phaseDurations: payload.phaseDurations,
                deadline: payload.deadline || null
            }
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/of-classroom/${classroomId}`,
                body,
                { headers: { "Content-Type": "application/json" } }
            )
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const phases = [
        { key: "phase1", label: "Phase 1", desc: "Individual writing" },
        { key: "phase2", label: "Phase 2", desc: "Group discussion" },
        { key: "phase3", label: "Phase 3", desc: "Consensus writing" }
    ]

    return (
        <div className='add-session-overlay'>
            <div className="add-session-wrapper">
                <motion.div
                    key="session-form"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="session-form-container"
                >
                    <form className='add-session-form' onSubmit={handleSubmit}>
                        <div className="session-title-line">
                            <div className="session-title-left">
                                <div className="session-icon-badge">
                                    <i className="ri-team-line" />
                                </div>
                                <div>
                                    <span className="session-form-title">New Session</span>
                                    <p className="session-form-subtitle">Launch a collaborative assignment session</p>
                                </div>
                            </div>
                            <button type="button" className="session-close-btn" onClick={onClose}>
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="session-inputs-box">

                            {/* Assignment selector */}
                            <div className="session-form-section">
                                <label className="session-label">Assignment</label>
                                {payload.assignmentId ? (
                                    <div className="session-selected-ref">
                                        {payload.refThumbnail && (
                                            <img src={payload.refThumbnail} alt="" className="session-ref-thumb" />
                                        )}
                                        <div className="session-ref-info">
                                            <span className="session-ref-title">{payload.refTitle}</span>
                                            <span className="session-ref-category">{payload.refCategory?.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="session-ref-change-btn"
                                            onClick={() => setShowPopup(true)}
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={`session-pick-btn ${errors.assignment ? "session-pick-btn-error" : ""}`}
                                        onClick={() => setShowPopup(true)}
                                    >
                                        <i className="ri-file-list-3-line" />
                                        <span>Pick an assignment</span>
                                        <i className="ri-arrow-right-s-line" style={{ marginLeft: "auto" }} />
                                    </button>
                                )}
                                {errors.assignment && <p className="session-error-text">{errors.assignment}</p>}

                                <AnimatePresence>
                                    {showPopup && (
                                        <AssignmentPopup
                                            items={assignments}
                                            loading={assignmentsLoading}
                                            onSelect={handleSelectAssignment}
                                            onClose={() => setShowPopup(false)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Phase durations */}
                            <div className="session-form-section">
                                <label className="session-label">Phase durations <span className="session-label-hint">(minutes)</span></label>
                                <div className="session-phases-grid">
                                    {phases.map(({ key, label, desc }) => (
                                        <div key={key} className="session-phase-card">
                                            <div className="session-phase-header">
                                                <span className="session-phase-label">{label}</span>
                                                <span className="session-phase-desc">{desc}</span>
                                            </div>
                                            <div className="session-phase-input-row">
                                                <button
                                                    type="button"
                                                    className="session-phase-stepper"
                                                    onClick={() => handleDurationChange(key, payload.phaseDurations[key] - 5)}
                                                >−</button>
                                                <input
                                                    type="number"
                                                    className="session-phase-input"
                                                    value={payload.phaseDurations[key]}
                                                    min={1}
                                                    max={120}
                                                    onChange={(e) => handleDurationChange(key, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="session-phase-stepper"
                                                    onClick={() => handleDurationChange(key, payload.phaseDurations[key] + 5)}
                                                >+</button>
                                                <span className="session-phase-unit">min</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deadline (optional) */}
                            <div className="session-form-section">
                                <label className="session-label">
                                    Deadline <span className="session-label-hint">(optional)</span>
                                </label>
                                <div className="session-input-line">
                                    <i className="ri-calendar-line session-input-icon" />
                                    <input
                                        type="datetime-local"
                                        className="session-datetime-input"
                                        value={payload.deadline}
                                        onChange={(e) => setPayload(p => ({ ...p, deadline: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="session-row-btns">
                            <button className='session-cancel-btn' type='button' onClick={onClose}>Cancel</button>
                            <button className='session-submit-btn' type='submit' disabled={loading}>
                                {loading ? (
                                    <><span className="spinner" /><span>Launching...</span></>
                                ) : (
                                    <><i className="ri-rocket-line" /><span>Launch Session</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}