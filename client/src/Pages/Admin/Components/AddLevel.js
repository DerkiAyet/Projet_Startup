import React, { useState, useRef } from 'react'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as ChangeIcon } from '../../../Assets/icons/TimelineIcons/change.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as XPIcon } from '../../../Assets/icons/AdminIcons/xp.svg'
import { motion } from "framer-motion";

import axios from 'axios'
import '../Styles/AddSubject.css'

const AddLevel = ({ onClose, levelAdded }) => {


    const [payload, setPayload] = useState({
        name: "",
        coverImg: "",
        xpRequired: ""
    })
    const [errors, setErrors] = useState({
        name: "",
        coverImg: "",
        xpRequired: "",
    })
    const [loading, setLoading] = useState(false)

    const subImgInputRef = useRef();
    const xpRequiredInputRef = useRef();

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPayload({
            ...payload,
            coverImg: file
        });
    };

    const handleSubmit = async (e) => {

        try {
            e.preventDefault()

            const newErrors = {};

            if (!payload.name.trim()) {
                newErrors.name = ("enter a name first")
            }

            if (!payload.coverImg) {
                newErrors.coverImg = ("upload a thumbnail");
            }

            if (!payload.xpRequired.trim()) {
                newErrors.xpRequired = ("select an xpRequired");
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({ name: "", coverImg: "", xpRequired: "" });

            setLoading(true)

            const formData = new FormData();
            formData.append("name", payload.name);
            formData.append("xpRequired", payload.xpRequired.replace('#', ''));
            formData.append("coverImg", payload.coverImg);

            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/game`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            levelAdded?.(res.data.newLevel)
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
                                    Create New Level
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
                                        placeholder={"Enter name the new level..."}
                                        value={payload.name}
                                        onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                                        onFocus={() => handleFocus("name")}
                                    />
                                </div>
                                {errors.name && <p className="error-text">{errors.name}</p>}
                            </div>
                            <div className="subImg-upload-section">
                                <span>Level Cover</span>

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
                                        {payload.coverImg ? (
                                            <>
                                                <img
                                                    src={URL.createObjectURL(payload.coverImg)}
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
                                                        setPayload({ ...payload, coverImg: null });
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
                                {errors.coverImg && <p className="error-text">{errors.coverImg}</p>}
                            </div>
                            <div className="form-input">
                                <div className="input-label">
                                    <label>Required XP</label>
                                </div>
                                <div
                                    className={`input-line ${errors.xpRequired ? "input-error" : ""}`}
                                    onClick={() => xpRequiredInputRef.current.click()}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <XPIcon className="input-icon" />
                                    <input
                                        ref={xpRequiredInputRef}
                                        type= "number"
                                        placeholder='specify the xp required to pass to next level'
                                        step={10}
                                        value={payload.xpRequired || 0}
                                        onChange={(e) => {
                                            setPayload({ ...payload, xpRequired: e.target.value });
                                            handleFocus('xpRequired');
                                        }}
                                    />
                                </div>
                                {errors.xpRequired && <p className="error-text">{errors.xpRequired}</p>}
                            </div>
                        </div>
                        <button className='submit-btn' type='submit' onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Creating</span>
                                </>
                            ) : (
                                <span>Add Level</span>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>

        </div>
    )
}

export default AddLevel
