import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
import { AppContext } from '../../../App';
import axios from 'axios'


function HeaderSession({ classroom, title, creatorName, phase, classroomId, sessionId }) {

    const { userAuth } = useContext(AppContext)

    const phaseColor = {
        1: { color: "#F59E0B", bg: "#FFFBEB" },
        2: { color: "#3B82F6", bg: "#EFF6FF" },
        3: { color: "#10B981", bg: "#ECFDF5" },
    }[phase] || { color: "#8E8E8E", bg: "#F1F5F9" };

    const handleNext = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/phase`, {}, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
        } catch (error) {
            console.error("error while passig to next phase", error.message)
        }
    }

    const handleComplete = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/${sessionId}/complete`, {}, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
        } catch (error) {
            console.error("error while passig to next phase", error.message)
        }
    }

    return (
        <div className="as-header">
            <div className="link-line">
                <Link to="/classrooms">Classrooms</Link> &gt; <span style={{textTransform: "capitalize"}}>{classroom}</span> &gt; <Link to="/classrooms">Sessions</Link> &gt; <span style={{textTransform: "capitalize"}}>{title}</span>
            </div>
            <h1 style={{ textTransform: "capitalize" }}>
                {title}
            </h1>
            <div className="course-features">
                <div className="cd-header-left">
                    <div className="feature-line">
                        <AuthorIcon className='cd-icon-header' />
                        {creatorName}
                    </div>
                    <div className="feature-line">
                        <span style={{
                            padding: "0.2rem 0.7rem", borderRadius: "20px",
                            fontSize: "0.78rem", fontWeight: 700,
                            color: phaseColor.color,
                            background: phaseColor.bg,
                        }}>
                            Phase: {phase}
                        </span>
                    </div>
                </div>
                <div className="options-header-right">
                    {userAuth.role === "teacher" && (
                        phase < 3 ? (
                            <button className='submit-btn' onClick={handleNext}>Go to Next Phase</button>
                        ) : (
                            <button className='submit-btn' onClick={handleComplete}>Complete Session</button>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

export default HeaderSession
