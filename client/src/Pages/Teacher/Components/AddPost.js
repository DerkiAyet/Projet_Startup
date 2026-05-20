import React, { useState, useEffect } from 'react'
import '../Styles/AddPost.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'

export const AddPostForm = ({ onClose }) => {
    const { classroomId } = useParams()

    const [payload, setPayload] = useState({
        content: "",
        type: "",
        refId: "",
        refTitle: "",
        refThumbnail: "",
        refCategory: {}
    })
    const [errors, setErrors] = useState({ content: "", type: "" })
    const [loading, setLoading] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const [contentList, setContentList] = useState([])
    const [contentLoading, setContentLoading] = useState(false)

    const fetchContent = async (type) => {
        try {
            setContentLoading(true)
            const endpoint = type === "course"
                ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/teacher-courses`
                : `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/teacher-assigns`
            const res = await axios.get(endpoint)
            setContentList(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setContentLoading(false)
        }
    }

    useEffect(() => {
        if (payload.type === "course" || payload.type === "assignment") {
            fetchContent(payload.type)
            setShowPopup(true)
        } else {
            setShowPopup(false)
            setContentList([])
        }
    }, [payload.type])

    const handleSelectContent = (item) => {
        setPayload(prev => ({
            ...prev,
            refId: item._id,
            refTitle: item.title,
            refThumbnail: item.thumbnail || "",
            refCategory: item.category || {}
        }))
        setShowPopup(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = {}

        if (!payload.type) newErrors.type = "Select the type of post"
        if (payload.type === "text" && !payload.content.trim()) newErrors.content = "Enter a message"
        if ((payload.type === "course" || payload.type === "assignment") && !payload.refId)
            newErrors.content = `Select a ${payload.type} first`

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
        setErrors({ content: "", type: "" })

        try {
            setLoading(true)
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/posts`,
                payload,
                { headers: { "Content-Type": "application/json" } }
            )
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const postOptions = ["text", "course", "assignment"]

    return (
        <div className='add-homework-overlay'>
            <div className="add-homework-wrapper">
                <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="form-container"
                >
                    <form className='add-homework-form' onSubmit={handleSubmit}>
                        <div className='title-box'>
                            <div className="title-line">
                                <span>Send Homework</span>
                                <CloseIcon onClick={onClose} style={{ cursor: "pointer" }} />
                            </div>
                        </div>

                        <div className="inputs-box">
                            {/* Type selector */}
                            <div className="form-input">
                                <div className="input-label">
                                    <label>Type</label>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <select
                                        className={`custom-select ${errors.type ? 'input-error' : ''}`}
                                        value={payload.type}
                                        onChange={(e) => setPayload({ ...payload, type: e.target.value, refId: "", refTitle: "", refThumbnail: "", refCategory: {} })}
                                    >
                                        <option value="">Select type</option>
                                        {postOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                                    </select>
                                    <ChevronIcon />
                                </div>
                                {errors.type && <p className="error-text">{errors.type}</p>}
                            </div>

                            {/* Text message input — only for text type */}
                            {payload.type === "text" && (
                                <div className="form-input">
                                    <div className="input-label"><label>Message</label></div>
                                    <div className={`input-line ${errors.content ? "input-error" : ""}`}>
                                        <input
                                            type="text"
                                            placeholder="Write a message about the homework"
                                            value={payload.content}
                                            onChange={(e) => setPayload({ ...payload, content: e.target.value })}
                                            onFocus={() => setErrors(p => ({ ...p, content: "" }))}
                                        />
                                    </div>
                                    {errors.content && <p className="error-text">{errors.content}</p>}
                                </div>
                            )}

                            {/* Selected content preview */}
                            {payload.refId && (
                                <div className="selected-ref-preview">
                                    {payload.refThumbnail && (
                                        <img src={fixMediaUrl(payload.refThumbnail)} alt="" className="ref-thumb" />
                                    )}
                                    <div className="ref-info">
                                        <span className="ref-title">{payload.refTitle}</span>
                                        <span className="ref-category">{payload.refCategory?.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="ref-change-btn"
                                        onClick={() => { setShowPopup(true); fetchContent(payload.type) }}
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                            {/* Content popup */}
                            <AnimatePresence>
                                {showPopup && (payload.type === "course" || payload.type === "assignment") && (
                                    <ContentPopup
                                        type={payload.type}
                                        items={contentList}
                                        loading={contentLoading}
                                        onSelect={handleSelectContent}
                                        onClose={() => setShowPopup(false)}
                                    />
                                )}
                            </AnimatePresence>

                            {errors.content && !payload.refId && payload.type !== "text" && (
                                <p className="error-text">{errors.content}</p>
                            )}
                        </div>

                        <div className="row-btns">
                            <button className='cancel-btn' type='button' onClick={onClose}>
                                <span>Cancel</span>
                            </button>
                            <button className='submit-btn' type='submit' disabled={loading}>
                                {loading ? (<><span className="spinner" /><span>Sending</span></>) : <span>Send</span>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

const ChevronIcon = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
    </svg>
)

const ContentPopup = ({ type, items, loading, onSelect, onClose }) => (
    <motion.div
        className="content-popup"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
    >
        <div className="content-popup-header">
            <span>Select a {type}</span>
            <button type="button" className="popup-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="content-popup-list">
            {loading ? (
                <div className="popup-loading">
                    <div className="loading-spinner" />
                    <span>Loading {type}s...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="popup-empty">No {type}s found</div>
            ) : (
                items.map(item => (
                    <div key={item._id} className="content-popup-item" onClick={() => onSelect(item)}>
                        <div className="popup-item-thumb">
                            {item.thumbnail
                                ? <img src={fixMediaUrl(item.thumbnail)} alt={item.title} />
                                : <div className="popup-thumb-fallback">{item.title?.charAt(0)}</div>
                            }
                        </div>
                        <div className="popup-item-info">
                            <span className="popup-item-title">{item.title}</span>
                            <div className="popup-item-meta">
                                {item.category?.name && (
                                    <span className="popup-item-badge">{item.category.name}</span>
                                )}
                                {item.level && (
                                    <span className="popup-item-level">{item.level}</span>
                                )}
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line popup-item-arrow" />
                    </div>
                ))
            )}
        </div>
    </motion.div>
)