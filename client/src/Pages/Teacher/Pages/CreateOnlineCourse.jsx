import React, { useState, useRef, useEffect } from 'react'
import '../Styles/CreateCourse.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import PublishSuccessPopup from '../Components/Publishsuccesspopup'
import axios from 'axios'

axios.defaults.withCredentials = true

const PLATFORMS = [
    { value: 'zoom',        label: 'Zoom' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'youtube',     label: 'YouTube' },
    { value: 'teams',       label: 'Microsoft Teams' },
    { value: 'other',       label: 'Other' },
]

const RECURRENCE_PATTERNS = [
    { value: 'daily',    label: 'Daily' },
    { value: 'weekly',   label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly',  label: 'Monthly' },
]

// reusable chevron svg
const Chevron = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
        style={{ position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
    </svg>
)

function CreateOnlineCourse() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: null,
        platform: '',
        sessionUrl: '',
        schedule: {
            startDate: '',
            endDate: '',
            recurring: false,
            recurrencePattern: '',
        },
        category: {
            id: '',
            subCategory: '',
        },
    })

    const [errors, setErrors] = useState({})
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)

    const thumbnailInputRef = useRef()
    const descriptionRef = useRef()

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-teacher-expertise`)
            .then(res => setCategories(res.data))
            .catch(err => console.error(err))
    }, [])

    const selectedCategory = categories.find(c => c.idSubject === formData.category.id)
    const availableSubcategories = selectedCategory?.subCategories || []

    // ── Helpers ──────────────────────────────────────────────

    const set = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const setSchedule = (field, value) => {
        setFormData(prev => ({
            ...prev,
            schedule: { ...prev.schedule, [field]: value }
        }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const setCategory = (field, value) => {
        setFormData(prev => ({
            ...prev,
            category: { ...prev.category, [field]: value }
        }))
        setErrors(prev => ({ ...prev, category: '' }))
    }

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0]
        if (file) set('thumbnail', file)
    }

    const handleDescriptionChange = () => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = 'auto'
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`
        }
        set('description', descriptionRef.current.value)
    }

    // ── Validation ────────────────────────────────────────────

    const validate = () => {
        const e = {}
        if (!formData.title.trim())         e.title = 'Please enter a session title.'
        if (!formData.platform)             e.platform = 'Please select a platform.'
        if (!formData.sessionUrl.trim())    e.sessionUrl = 'Please enter the session URL.'
        if (!formData.category.id)          e.category = 'Please select a category.'
        if (!formData.schedule.startDate)   e.startDate = 'Please set a start date.'
        if (
            formData.schedule.endDate &&
            formData.schedule.startDate &&
            new Date(formData.schedule.endDate) <= new Date(formData.schedule.startDate)
        ) {
            e.endDate = 'End date must be after start date.'
        }
        if (formData.schedule.recurring && !formData.schedule.recurrencePattern) {
            e.recurrencePattern = 'Please select a recurrence pattern.'
        }
        return e
    }

    // ── Submit ────────────────────────────────────────────────

    const handlePublish = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }

        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('title', formData.title)
            fd.append('description', formData.description)
            fd.append('platform', formData.platform)
            fd.append('sessionUrl', formData.sessionUrl)
            fd.append('schedule', JSON.stringify({
                startDate: formData.schedule.startDate || undefined,
                endDate: formData.schedule.endDate || undefined,
                recurring: formData.schedule.recurring,
                recurrencePattern: formData.schedule.recurring
                    ? formData.schedule.recurrencePattern
                    : undefined,
            }))
            fd.append('category', JSON.stringify({
                id: Number(formData.category.id),
                subCategory: Number(formData.category.subCategory) || 0,
            }))
            if (formData.thumbnail) fd.append('thumbnail', formData.thumbnail)

            await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/online-courses`, fd)
            setShowSuccessPopup(true)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="create-course-container">
            <div className="create-course-wrapper">

                <div className="create-course-header">
                    <h1 className="create-course-title">Create Online Session</h1>
                    <p>Schedule a live session and share the link with your students</p>
                </div>

                <form className="create-course-form" onSubmit={handlePublish}>

                    {/* ── Title ── */}
                    <div className="form-group">
                        <span>Session Title</span>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="e.g. Introduction to Linear Algebra"
                                value={formData.title}
                                onChange={e => set('title', e.target.value)}
                                onFocus={() => setErrors(p => ({ ...p, title: '' }))}
                                className={errors.title ? 'input-error' : ''}
                            />
                            {errors.title && <p className="error-text">{errors.title}</p>}
                        </div>
                    </div>

                    {/* ── Thumbnail ── */}
                    <div className="thumbnail-upload-section">
                        <span>Session Thumbnail <span style={{ fontSize: '0.82rem', color: '#8E8E8E', fontWeight: 400 }}>(optional)</span></span>
                        <div className="drop-zone-wrapper">
                            <div
                                className="thumbnail-dropzone"
                                onClick={() => thumbnailInputRef.current.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault()
                                    const file = e.dataTransfer.files[0]
                                    if (file) set('thumbnail', file)
                                }}
                            >
                                {formData.thumbnail ? (
                                    <>
                                        <img
                                            src={URL.createObjectURL(formData.thumbnail)}
                                            alt="thumbnail preview"
                                            className="thumbnail-preview"
                                        />
                                        <button type="button" className="thumb-btn change-btn"
                                            onClick={e => { e.stopPropagation(); thumbnailInputRef.current.click() }}>
                                            Change
                                        </button>
                                        <button type="button" className="thumb-btn delete-btn"
                                            onClick={e => { e.stopPropagation(); set('thumbnail', null) }}>
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <div className="thumbnail-placeholder">
                                        <p>Click or drop an image here</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" ref={thumbnailInputRef}
                                    style={{ display: 'none' }} onChange={handleThumbnailChange} />
                            </div>
                        </div>
                    </div>

                    {/* ── Description ── */}
                    <div className="form-group">
                        <span>Description <span style={{ fontSize: '0.82rem', color: '#8E8E8E', fontWeight: 400 }}>(optional)</span></span>
                        <div className="input-wrapper">
                            <textarea
                                placeholder="What will students learn in this session?"
                                ref={descriptionRef}
                                value={formData.description}
                                onChange={handleDescriptionChange}
                            />
                        </div>
                    </div>

                    {/* ── Platform + URL ── */}
                    <div className="form-group">
                        <span>Platform</span>
                        <div className="select-flex">
                            <div className="select-flex-line" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        className={`custom-select ${errors.platform ? 'input-error' : ''}`}
                                        value={formData.platform}
                                        onChange={e => set('platform', e.target.value)}
                                    >
                                        <option value="">Platform</option>
                                        {PLATFORMS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <Chevron />
                                    {errors.platform && <p className="error-text">{errors.platform}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <span>Session URL</span>
                        <div className="input-wrapper">
                            <input
                                type="url"
                                placeholder="https://zoom.us/j/..."
                                value={formData.sessionUrl}
                                onChange={e => set('sessionUrl', e.target.value)}
                                onFocus={() => setErrors(p => ({ ...p, sessionUrl: '' }))}
                                className={errors.sessionUrl ? 'input-error' : ''}
                            />
                            {errors.sessionUrl && <p className="error-text">{errors.sessionUrl}</p>}
                        </div>
                    </div>

                    {/* ── Schedule ── */}
                    <div className="form-group">
                        <div className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                            {/* Start + End */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: "center" }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '0.3rem', textTransform: 'capitalize', letterSpacing: '0.04em', fontFamily: "Nunito, sans serif" }}>
                                        Start Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.startDate}
                                        onChange={e => setSchedule('startDate', e.target.value)}
                                        className={errors.startDate ? 'input-error' : ''}
                                        style={{ width: '100%' }}
                                    />
                                    {errors.startDate && <p className="error-text">{errors.startDate}</p>}
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '0.3rem', textTransform: 'capitalize', letterSpacing: '0.04em', fontFamily: "Nunito, sans serif" }}>
                                        End Date & Time <span style={{ fontSize: '0.62rem', color: '#8E8E8E', fontWeight: 400, textTransform: "capitalize" }}>(optional)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.endDate}
                                        onChange={e => setSchedule('endDate', e.target.value)}
                                        className={errors.endDate ? 'input-error' : ''}
                                        style={{ width: '100%' }}
                                    />
                                    {errors.endDate && <p className="error-text">{errors.endDate}</p>}
                                </div>
                            </div>

                            {/* Recurring toggle */}
                            <label className="oc-recurring-toggle">
                                <input
                                    type="checkbox"
                                    checked={formData.schedule.recurring}
                                    onChange={e => {
                                        setSchedule('recurring', e.target.checked)
                                        if (!e.target.checked) setSchedule('recurrencePattern', '')
                                    }}
                                />
                                <span className="oc-toggle-label">This session repeats?</span>
                            </label>

                            {/* Recurrence pattern — shown only when recurring */}
                            {formData.schedule.recurring && (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        className={`custom-select ${errors.recurrencePattern ? 'input-error' : ''}`}
                                        value={formData.schedule.recurrencePattern}
                                        onChange={e => setSchedule('recurrencePattern', e.target.value)}
                                        style={{ width: '200px' }}
                                    >
                                        <option value="">Repeats…</option>
                                        {RECURRENCE_PATTERNS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    {errors.recurrencePattern && <p className="error-text">{errors.recurrencePattern}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Category ── */}
                    <div className="form-group">
                        <div className="select-flex">
                            <div className="select-flex-line" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        className={`custom-select ${errors.category ? 'input-error' : ''}`}
                                        value={formData.category.id}
                                        onChange={e => {
                                            const val = parseInt(e.target.value)
                                            setFormData(prev => ({
                                                ...prev,
                                                category: { id: val, subCategory: '' }
                                            }))
                                            setErrors(p => ({ ...p, category: '' }))
                                        }}
                                    >
                                        <option value="">Category</option>
                                        {categories.map(c => (
                                            <option key={c.idSubject} value={c.idSubject}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Chevron />
                                    {errors.category && <p className="error-text">{errors.category}</p>}
                                </div>

                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        className="custom-select"
                                        disabled={availableSubcategories.length === 0}
                                        value={formData.category.subCategory}
                                        onChange={e => setCategory('subCategory', parseInt(e.target.value))}
                                    >
                                        <option value="">Field</option>
                                        {availableSubcategories.map(sub => (
                                            <option key={sub.idSub} value={sub.idSub}>{sub.name}</option>
                                        ))}
                                    </select>
                                    <Chevron />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="course-btn-actions">
                        <button type="submit" className="create-course-button" disabled={loading}>
                            <DocumentIcon />
                            {loading ? 'Publishing…' : 'Publish Session'}
                        </button>
                    </div>

                </form>
            </div>

            {showSuccessPopup && (
                <PublishSuccessPopup
                    title={formData.title}
                    type="Online Session"
                    onClose={() => setShowSuccessPopup(false)}
                />
            )}
        </div>
    )
}

export default CreateOnlineCourse