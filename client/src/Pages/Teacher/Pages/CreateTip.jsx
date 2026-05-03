import React, { useState, useRef, useEffect } from 'react'
import '../Styles/CreateCourse.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as PrintIcon } from '../../../Assets/icons/CourseIcons/print-course.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import JoditEditor from "jodit-react";
import PublishSuccessPopup from '../Components/Publishsuccesspopup'
import axios from 'axios'

function CreateTip() {

    const [tipData, setTipData] = useState({
        title: "",
        description: "",
        thumbnail: null,
        category: {
            id: 0,
            subCategory: 0
        },
        content: ""
    });

    const [step, setStep] = useState(0);

    const thumbnailInputRef = useRef();

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setTipData({
            ...tipData,
            thumbnail: file
        });
    };

    const descriptionRef = useRef(null);

    const handlePlanText = () => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = "auto";
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    };

    const [categories, setCategories] = useState([])

    useEffect(() => {

        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-teacher-expertise`)
            .then((res) => setCategories(res.data))
            .catch((err) => console.error(err.response.data))

    }, [])

    const levels = ["Beginner", "Intermediate", "Advanced"];

    const selectedCategory = categories.find(cat => cat.idSubject === tipData.category.id);
    const availableSubcategories = selectedCategory?.subCategories || [];
    const [errors, setErrors] = useState({
        title: "",
        description: "",
        content: ""
    });


    const handleFocus = (fieldName) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            [fieldName]: ""
        }));
    }

    const handleNext = (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!tipData.title.trim()) {
            newErrors.title = "Please enter the course name.";
        }

        if (!tipData.description.trim()) {
            newErrors.description = "Please enter the course description.";
        }

        if (!tipData.content.trim()) {
            newErrors.level = "Please enter the tip content.";
        }

        // If there are errors → show UI errors, stop function
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Clear previous errors
        setErrors({ identifier: "", password: "" });

        setStep(step + 1);

    }

    const [showSuccessPopup, setShowSuccessPopup] = useState(false)


    const handlePublish = async () => {
        try {

            const formData = new FormData();

            formData.append("title", tipData.title);
            formData.append("description", tipData.description);
            formData.append("thumbnail", tipData.thumbnail);
            formData.append("category", JSON.stringify(tipData.category));


            await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`, formData)

            setShowSuccessPopup(true)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className='create-course-container'>
            <div className="create-course-wrapper">
                {
                    step === 0 ?
                        <>
                            <div className="create-course-header">
                                <h1 className='create-course-title'>Create New Tip</h1>
                                <p>Build engaging tip content with rich media and interactive elements</p>
                            </div>
                            <form className='create-course-form'>
                                <div className="form-group">
                                    <span>Tip Name</span>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            placeholder="Enter course name"
                                            required
                                            value={tipData.title}
                                            onChange={(e) => setTipData({ ...tipData, title: e.target.value })}
                                            className={errors.title ? 'input-error' : ''}
                                            onFocus={() => handleFocus("title")}
                                        />
                                        {errors.title && <p className="error-text">{errors.title}</p>}
                                    </div>
                                </div>
                                <div className="thumbnail-upload-section">
                                    <span>Tip Thumbnail</span>

                                    <div className="drop-zone-wrapper">
                                        <div
                                            className="thumbnail-dropzone"
                                            onClick={() => thumbnailInputRef.current.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files[0];
                                                if (file) handleThumbnailChange({ target: { files: [file] } });
                                            }}
                                        >
                                            {tipData.thumbnail ? (
                                                <>
                                                    <img
                                                        src={URL.createObjectURL(tipData.thumbnail)}
                                                        alt="thumbnail preview"
                                                        className="thumbnail-preview"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="thumb-btn change-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            thumbnailInputRef.current.click();
                                                        }}
                                                    >
                                                        Change
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="thumb-btn delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTipData({ ...tipData, thumbnail: null });
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="thumbnail-placeholder">
                                                    <p>Click or drop an image here</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={thumbnailInputRef}
                                                style={{ display: "none" }}
                                                onChange={handleThumbnailChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <span>Tip Description</span>
                                    <div className="input-wrapper">
                                        <textarea
                                            id="description"
                                            name="description"
                                            className={errors.description ? 'input-error' : ''}
                                            placeholder="Enter course description"
                                            required
                                            ref={descriptionRef}
                                            value={tipData.description}
                                            onChange={() => { handlePlanText(); setTipData({ ...tipData, description: descriptionRef.current.value }) }}
                                            onFocus={() => handleFocus("description")}
                                        />
                                        {errors.description && <p className="error-text">{errors.description}</p>}
                                    </div>
                                </div>
                                <div className="select-flex">
                                    <div className="select-flex-line">
                                        <div style={{ position: "relative", display: "inline-block" }}>
                                            <select
                                                className={`custom-select ${errors.category ? 'input-error' : ''}`}
                                                required
                                                value={tipData.category.id}
                                                onChange={(e) => {
                                                    const newCategory = e.target.value;
                                                    const selected = categories.find(cat => cat.idSubject === newCategory);
                                                    const hasSubs = selected?.subCategories?.length > 0;

                                                    setTipData({
                                                        ...tipData,
                                                        category: { ...tipData.category, id: parseInt(newCategory), subCategory: hasSubs ? "" : "" }
                                                    });
                                                }}
                                            >
                                                <option value="">Category</option>
                                                {categories.map(c => <option value={c.idSubject}>{c.name}</option>)}
                                            </select>
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    position: "absolute",
                                                    right: "60px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}
                                            >
                                                <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                                            </svg>
                                            {errors.category && <p className="error-text">{errors.category}</p>}
                                        </div>
                                        <div style={{ position: "relative", display: "inline-block" }}>
                                            <select
                                                className="custom-select"
                                                disabled={availableSubcategories.length === 0}
                                                value={tipData.category.subCategory}
                                                onChange={(e) => setTipData({ ...tipData, category: { ...tipData.category, subCategory: parseInt(e.target.value) } })}
                                            >
                                                <option value="">Field</option>

                                                {availableSubcategories.map((sub) => (
                                                    <option key={sub.idSub} value={sub.idSub}>{sub.name}</option>
                                                ))}
                                            </select>
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    position: "absolute",
                                                    right: "60px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}
                                            >
                                                <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                                            </svg>
                                        </div>

                                        <div style={{ position: "relative", display: "inline-block" }} >
                                            <select
                                                className={`custom-select ${errors.level ? 'input-error' : ''}`}
                                                value={tipData.level}
                                                onChange={(e) => setTipData({ ...tipData, level: e.target.value })}
                                            >
                                                <option>Level</option>
                                                {levels.map(l => <option key={l}>{l}</option>)}
                                            </select>
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    position: "absolute",
                                                    right: "60px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}
                                            >
                                                <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                                            </svg>
                                            {errors.level && <p className="error-text">{errors.level}</p>}
                                        </div>

                                    </div>
                                </div>
                                <div className="course-btn-actions">
                                    <button className='draft-btn'>Save as Draft</button>
                                    <button type="submit" className='create-course-button' onClick={handleNext}>
                                        <DocumentIcon />
                                        Create Course
                                    </button>
                                </div>
                            </form>
                        </> :
                        <div className="lesson-editor-container">
                            <div className="lesson-editor-header">
                                <div className="header-left">
                                    <h5>{tipData.title}</h5>
                                    <EditIcon />
                                </div>
                                <div className="header-right">
                                    <button className="draft-btn">Save as Draft</button>
                                    <button className='submit-btn' onClick={() => handlePublish()}>
                                        Publish
                                    </button>
                                    <button className='print-btn'>
                                        Print
                                        <PrintIcon />
                                    </button>
                                </div>
                            </div>

                            <JoditEditor
                                value={tipData.content || ""}
                                onBlur={(newContent) => {
                                    setTipData({ ...tipData, content: newContent });
                                }}
                                config={{
                                    uploader: { insertImageAsBase64URI: true },
                                    toolbarAdaptive: false
                                }}
                            />

                            <button className="draft-btn lesson-back-btn" onClick={() => setStep(0)}>
                                <BackIcon /> Back
                            </button>
                        </div>

                }
            </div>
            {
                showSuccessPopup && (
                    <PublishSuccessPopup
                        title={tipData.title}
                        type={"tip"}
                        onClose={() => setShowSuccessPopup(false)}
                    />
                )
            }
        </div >
    )
}


export default CreateTip
