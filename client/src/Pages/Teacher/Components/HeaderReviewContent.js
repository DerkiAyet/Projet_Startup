import React, { useContext } from 'react'
import { Link } from 'react-router-dom';
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
import { ReactComponent as TargetIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg';
import { AppContext } from '../../../App';

function HeaderReviewContent({ title, studentName, assignmentLevel, submittedAt, status, totalScore, maxScore, handleSubmit, submitting }) {

    const { userAuth } = useContext(AppContext)

    const statusColor = {
        submitted: { color: "#F59E0B", bg: "#FFFBEB" },
        reviewed: { color: "#3B82F6", bg: "#EFF6FF" },
        graded: { color: "#10B981", bg: "#ECFDF5" },
    }[status] || { color: "#8E8E8E", bg: "#F1F5F9" };

    return (
        <div className="as-header">
            <div className="link-line">
                <Link to="/assignments">Assignments</Link> &gt; <span>{title}</span>
            </div>
            <h1 style={{textTransform: "capitalize"}}>{title}</h1>
            <div className="course-features">
                <div className="cd-header-left">
                    <div className="feature-line">
                        <AuthorIcon className='cd-icon-header' />
                        {studentName}
                    </div>
                    {submittedAt && (
                        <div className="feature-line">
                            <CalendarIcon className='cd-icon-header' />
                            {new Date(submittedAt).toLocaleDateString()}
                        </div>
                    )}
                    {assignmentLevel && (
                        <div className="feature-line">
                            <TargetIcon className='cd-icon-header' />
                            {assignmentLevel}
                        </div>
                    )}
                    {status && (
                        <div className="feature-line">
                            <span style={{
                                padding: "0.2rem 0.7rem", borderRadius: "20px",
                                fontSize: "0.78rem", fontWeight: 700,
                                color: statusColor.color,
                                background: statusColor.bg,
                            }}>
                                {status}
                            </span>
                        </div>
                    )}
                    {(totalScore !== undefined && maxScore !== undefined) && (
                        <div className="feature-line" style={{ fontWeight: 700, color: "#EC4899" }}>
                            Score: {totalScore} / {maxScore}
                        </div>
                    )}
                </div>
                <div className="options-header-right">
                    <button
                        className='submit-btn'
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                    >
                        {submitting ? "Submitting..." : "Submit Grades"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HeaderReviewContent