import React from 'react';

function SubmitSheetConfirm({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </div>

        <p className="modal-title">Submit your solution for this exercise?</p>
        <p className="modal-desc">
          Make sure you've reviewed your answer before confirming.
        </p>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Go back</button>
          <button className="btn-confirm" onClick={onConfirm}>Yes, submit</button>
        </div>
      </div>
    </div>
  );
}

export default SubmitSheetConfirm;