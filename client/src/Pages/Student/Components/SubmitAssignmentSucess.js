import React from 'react'
import '../Styles/Popup.css'

function SubmitAssignmentSuccess({ assignmentTitle, onClose, }) {

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                <div className="popup-confetti">
                    {[...Array(12)].map((_, i) => (
                        <span key={i} className={`confetti-dot confetti-dot--${i}`} />
                    ))}
                </div>

                <div className="popup-icon-wrap">
                    <div className="popup-icon-ring" />
                    <div className="popup-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                <h2 className="popup-title">
                    Your solution for <strong>{assignmentTitle || "the assignment"}</strong> has been submitted!
                </h2>
                <p className="popup-subtitle">
                    <strong>{assignmentTitle || "Your assignment"}</strong> has been successfully submitted and is now awaiting review. You will receive feedback and your grade once the teacher has evaluated your work.
                </p>

                <div className="popup-actions">
                    <button className="popup-btn popup-btn--quiz" onClick={onClose}>
                        Understood!
                    </button>

                </div>
            </div>
        </div>
    )
}

export default SubmitAssignmentSuccess