import React, { useState, useRef, useEffect } from 'react'
import '../../Teacher/Styles/CreateCourse.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import PublishSuccessPopup from '../Components/PublishSuccessPopup'
import axios from 'axios'

axios.defaults.withCredentials = true

// reusable chevron svg
const Chevron = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
        style={{ position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
    </svg>
)

function CreateRessource() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: null,
        category: {
            id: '',
            subCategory: '',
        },
        attachments: []
    })

    const [errors, setErrors] = useState({})
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)

    const thumbnailInputRef = useRef()
    const descriptionRef = useRef()

    const attachmentsInputRef = useRef()

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-subjects`)
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
        if (!formData.title.trim()) e.title = 'Please enter a session title.'
        if (!formData.category.id) e.category = 'Please select a category.'
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
            fd.append('category', JSON.stringify({
                id: Number(formData.category.id),
                subCategory: Number(formData.category.subCategory) || 0,
            }))
            formData.attachments.forEach(file => fd.append('attachmentFiles', file))
            if (formData.thumbnail) fd.append('thumbnail', formData.thumbnail)

            await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources`, fd)
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
                    <h1 className="create-course-title">Share Some Ressources</h1>
                    <p>Be generous and  share some helpful ressources with your colleges.</p>
                </div>

                <form className="create-course-form" onSubmit={handlePublish}>

                    {/* ── Title ── */}
                    <div className="form-group">
                        <span>Title</span>
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

                    <div className="thumbnail-upload-section">
                        <span>Thumbnail <span style={{ fontSize: '0.82rem', color: '#8E8E8E', fontWeight: 400 }}>(optional)</span></span>
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

                    <div className="form-group">
                        <span>Attachments</span>
                        <div className="drop-zone-wrapper">
                            <div
                                className="thumbnail-dropzone"
                                onClick={() => attachmentsInputRef.current.click()} //this what lauch the input since it is hidden, the ref is linked to the input
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault()
                                    const files = Array.from(e.dataTransfer.files)
                                    if (files.length) set('attachments', [...formData.attachments, ...files])
                                }}
                            >
                                <div className="thumbnail-placeholder">
                                    <p>Click or drop files here</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    ref={attachmentsInputRef}
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        const files = Array.from(e.target.files)
                                        set('attachments', [...formData.attachments, ...files])
                                    }}
                                />
                            </div>

                            {formData.attachments.length > 0 && (
                                <ul className="attachments-list">
                                    {formData.attachments.map((file, i) => (
                                        <li key={i} className="attachment-item">
                                            <span>{file.name}</span>
                                            <button
                                                type="button"
                                                className="delete-btn attachment-btn"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    set('attachments', formData.attachments.filter((_, j) => j !== i))
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="course-btn-actions">
                        <button type="submit" className="create-course-button" disabled={loading}>
                            <DocumentIcon />
                            {loading ? 'Publishing…' : 'Publish Ressource'}
                        </button>
                    </div>

                </form>
            </div>

            {showSuccessPopup && (
                <PublishSuccessPopup
                    title={formData.title}
                    type="ressource"
                    onClose={() => setShowSuccessPopup(false)}
                />
            )}
        </div>
    )
}

export default CreateRessource