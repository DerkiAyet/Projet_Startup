import React, { useState, useRef } from 'react'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as ChangeIcon } from '../../../Assets/icons/TimelineIcons/change.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as ColorIcon } from '../../../Assets/icons/AdminIcons/color.svg'
import { motion } from "framer-motion";

import axios from 'axios'
import '../Styles/AddSubject.css'

const AddSubject = ({ onClose, subjectAdded }) => {


    const [payload, setPayload] = useState({
        name: "",
        subImg: "",
        color: ""
    })
    const [errors, setErrors] = useState({
        name: "",
        subImg: "",
        color: "",
    })
    const [loading, setLoading] = useState(false)

    const subImgInputRef = useRef();
    const colorInputRef = useRef();

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPayload({
            ...payload,
            subImg: file
        });
    };

    const handleSubmit = async (e) => {

        try {
            e.preventDefault()

            const newErrors = {};

            if (!payload.name.trim()) {
                newErrors.name = ("enter a name first")
            }

            if (!payload.subImg) {
                newErrors.subImg = ("upload a thumbnail");
            }

            if (!payload.color.trim()) {
                newErrors.color = ("select a color");
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({ name: "", subImg: "", color: "" });

            setLoading(true)

            const formData = new FormData();
            formData.append("name", payload.name);
            formData.append("color", payload.color.replace('#', ''));
            formData.append("subImg", payload.subImg);

            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/add-subject`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            subjectAdded?.(res.data.newSubject)
            onClose()

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFocus = (fieldName) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            [fieldName]: ""
        }));
    }

    return (
        <div className='add-subject-overlay'>
            <div className="add-subject-wrapper">
                <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="form-container"
                >
                    <form action="" className='add-subject-form'>
                        <div className='title-box'>
                            <div className="title-line">
                                <span>
                                    Create New Subject
                                </span>
                                <CloseIcon onClick={onClose} />
                            </div>
                        </div>
                        <div className="inputs-box">
                            <div className="form-input">
                                <div className="input-label">
                                    <label htmlFor="email">
                                        Name
                                    </label>
                                </div>
                                <div className={`input-line ${errors.name ? "input-error" : ""}`}>
                                    <EditIcon className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder={"Enter name the new subject..."}
                                        value={payload.name}
                                        onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                                        onFocus={() => handleFocus("name")}
                                    />
                                </div>
                                {errors.name && <p className="error-text">{errors.name}</p>}
                            </div>
                            <div className="subImg-upload-section">
                                <span>Subject Thumbnail</span>

                                <div className="drop-zone-wrapper">
                                    <div
                                        className="subImg-dropzone"
                                        onClick={() => subImgInputRef.current.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            if (file) handleThumbnailChange({ target: { files: [file] } });
                                        }}
                                    >
                                        {payload.subImg ? (
                                            <>
                                                <img
                                                    src={URL.createObjectURL(payload.subImg)}
                                                    alt="subject thumbnail preview"
                                                    className="subImg-preview"
                                                />
                                                <button
                                                    type="button"
                                                    className="thumb-btn change-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        subImgInputRef.current.click();
                                                    }}
                                                >
                                                    <ChangeIcon />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="thumb-btn delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPayload({ ...payload, subImg: null });
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="subImg-placeholder">
                                                <p>Click or drop an image here</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={subImgInputRef}
                                            style={{ display: "none" }}
                                            onChange={handleThumbnailChange}
                                        />
                                    </div>
                                </div>
                                {errors.subImg && <p className="error-text">{errors.subImg}</p>}
                            </div>
                            <div className="form-input">
                                <div className="input-label">
                                    <label>Color</label>
                                </div>
                                <div
                                    className={`input-line ${errors.color ? "input-error" : ""}`}
                                    onClick={() => colorInputRef.current.click()}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <ColorIcon className="input-icon" />
                                    <div
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '6px',
                                            backgroundColor: payload.color || 'transparent',
                                            border: '1.5px solid var(--stroke-form-color)',
                                            flexShrink: 0
                                        }}
                                    />
                                    <span style={{ color: payload.color ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {payload.color ? payload.color : 'Choose a color...'}
                                    </span>
                                    <input
                                        ref={colorInputRef}
                                        type="color"
                                        value={payload.color || '#EC4899'}
                                        onChange={(e) => {
                                            setPayload({ ...payload, color: e.target.value });
                                            handleFocus('color');
                                        }}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                                    />
                                </div>
                                {errors.color && <p className="error-text">{errors.color}</p>}
                            </div>
                        </div>
                        <button className='submit-btn' type='submit' onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Creating</span>
                                </>
                            ) : (
                                <span>Add Subject</span>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>

        </div>
    )
}

export default AddSubject
