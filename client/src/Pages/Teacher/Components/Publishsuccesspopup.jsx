import React from 'react'
import '../Styles/CreateCourse.css'
import { Link } from 'react-router-dom'

function PublishSuccessPopup({ courseName, onClose, type, onAddQuiz, id }) {

  const returnTitle = () => {
    if (type === "course") {
      return "Course Published!"
    } else if (type === "assignment") {
      return "Assignment Published!"
    } else {
      return "Tip Published!"
    }
  }

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
          {returnTitle()}
        </h2>
        <p className="popup-subtitle">
          <strong>{courseName || "Your course"}</strong> is now live and available to students.
        </p>

        <div className="popup-actions">
          {
            type === "course" ?
              (<button className="popup-btn popup-btn--quiz" onClick={onAddQuiz}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
                Add a Quiz
              </button>) : <Link className="popup-btn popup-btn--quiz" to={`/courses/${id}?type=course`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
                Go and see your work
              </Link>
          }
          <button className="popup-btn popup-btn--close" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublishSuccessPopup