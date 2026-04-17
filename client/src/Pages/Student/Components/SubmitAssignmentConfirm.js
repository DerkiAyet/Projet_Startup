import React from 'react';

function SubmitAssignmentConfirm({ isOpen, onClose, onConfirm, assignmentData, exercises, problemsSolved }) {
  if (!isOpen) return null;

  const completedCount = problemsSolved.filter(p => p?.solution?.trim() !== "").length;
  const totalPoints = exercises.reduce((sum, e) => sum + (e.points || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </div>

        <p className="modal-title">Submit your solution?</p>
        <p className="modal-desc">
          Once submitted, you won't be able to edit your answers.
          Make sure you've reviewed all exercises before confirming.
        </p>

        <div className="modal-meta">
          <div className="modal-meta-row">
            <span>Assignment</span>
            <span>{assignmentData?.title}</span>
          </div>
          <div className="modal-meta-row">
            <span>Exercises completed</span>
            <span>{completedCount} / {exercises.length}</span>
          </div>
          <div className="modal-meta-row">
            <span>Total points</span>
            <span>{totalPoints} pts</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Go back</button>
          <button className="btn-confirm" onClick={onConfirm}>Yes, submit</button>
        </div>
      </div>
    </div>
  );
}

export default SubmitAssignmentConfirm;