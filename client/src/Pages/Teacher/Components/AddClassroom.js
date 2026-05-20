import React, { useState } from 'react'
import '../Styles/AddClassroom.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as EmailIcon } from "../../../Assets/icons/AuthIcons/email-auth-icon.svg"
import { ReactComponent as ChildIcon } from "../../../Assets/icons/AuthIcons/children-input.svg"
import { motion } from "framer-motion";

import axios from 'axios'
import { useContext } from 'react'
import { AppContext } from '../../../App'

export const AddClassroomForm = ({ onClose, classroomAdded }) => {

    const { userAuth } = useContext(AppContext)

    const [payload, setPayload] = useState({
        name: "",
        description: "",
        studentsIds: []
    })
    const [errors, setErrors] = useState({
        name: "",
        description: "",
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {

        try {
            e.preventDefault()

            const newErrors = {};

            if (!payload.name.trim()) {
                newErrors.name = ("enter a name first")
            }

            if (!payload.description.trim()) {
                newErrors.description = ("enter a valid description");
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({ name: "", description: "" });

            setLoading(true)

            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms`, payload, {
                headers: {
                    "Content-Type": "application/json"
                }
            })

            const newClassroom = {
                ...res.data,
                creator: {
                    userId: userAuth.userId,
                    userName:  userAuth.userName,
                    familyName:  userAuth.familyName,
                    givenName:  userAuth.givenName,
                    role: "teacher"
                }
            }

            classroomAdded?.(newClassroom)
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
        <div className='add-child-overlay'>
            <div className="add-child-wrapper">
                <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="form-container"
                >
                    <form action="" className='add-child-form'>
                        <div className='title-box'>
                            <div className="title-line">
                                <span>
                                    Create Your Classroom
                                </span>
                                <CloseIcon onClick={onClose} />
                            </div>
                        </div>
                        <div className="inputs-box child-box">
                            <div className="form-input">
                                <div className="input-label">
                                    <label htmlFor="email">
                                        Name
                                    </label>
                                </div>
                                <div className={`input-line ${errors.name ? "input-error" : ""}`}>
                                    <EmailIcon className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder={"Enter name of your classroom"}
                                        value={payload.name}
                                        onChange={(e) => setPayload({ ...payload, name: e.target.value })}
                                        onFocus={() => handleFocus("name")}
                                    />
                                </div>
                                {errors.name && <p className="error-text">{errors.name}</p>}
                            </div>
                            <div className="form-input">
                                <div className="input-label">
                                    <label htmlFor="email">
                                        Name
                                    </label>
                                </div>
                                <div className={`input-line ${errors.description ? "input-error" : ""}`}>
                                    <EmailIcon className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder={"description..."}
                                        value={payload.description}
                                        onChange={(e) => setPayload({ ...payload, description: e.target.value })}
                                        onFocus={() => handleFocus("description")}
                                    />
                                </div>
                                {errors.description && <p classdescription="error-text">{errors.name}</p>}
                            </div>
                        </div>
                        <button className='submit-btn' type='submit' onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Creating</span>
                                </>
                            ) : (
                                <span>Add Classroom</span>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>

        </div>
    )
}