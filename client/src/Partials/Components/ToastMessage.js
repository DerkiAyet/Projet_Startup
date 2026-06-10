import React, { useEffect } from 'react';
import "../Styles/Toast.css"

function ToastMessage({ message, subMessage, visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [visible]); 

  if (!visible) return null;

  return (
    <div className="toast">
      <div className="toast-dot" />
      <div className="toast-text">
        <span className="toast-title">{message}</span>
        <span className="toast-sub">{subMessage || "Just now"}</span>
      </div>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

export default ToastMessage;