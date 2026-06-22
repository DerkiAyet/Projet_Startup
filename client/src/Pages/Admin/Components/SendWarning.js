import { useState } from "react";
import "../Styles/SendWarning.css";
import { motion } from "framer-motion";
import { ReactComponent as WarningIcon } from "../../../Assets/icons/AdminIcons/warning.svg";
import axios from "axios"

export const SendWarning = ({ onClose, targetId, reportId }) => {
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(false)
    const [formData, setFormData] = useState({
        type: "warning",
        targetId: targetId,
        message: ""
    })

    const handleSend = async () => {
        setLoading(true)
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/reports/${reportId}/warning`,
                formData, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            setToast(true);
            setTimeout(() => {
                setToast(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error(error.response?.data?.error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <>
            <div className="delete-overlay">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="delete-popup warning"
                >
                    <div className="delete-popup__icon-wrap">
                        <WarningIcon className="delete-popup__icon" />
                    </div>
                    <p className="delete-popup__title">Send Warning</p>
                    <p className="delete-popup__desc">A warning will be sent to the owner of this item along with your explanation.</p>
                    <textarea
                        className="report-textarea"
                        placeholder="Add your note..."
                        value={formData.message}
                        onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                        }
                    />
                    <div className="delete-popup__actions">
                        <button className="delete-popup__btn cancel" onClick={onClose}>Cancel</button>
                        <button
                            className="delete-popup__btn confirm"
                            onClick={handleSend}
                            disabled={loading}
                        >
                            {loading && <span className="btn-spinner" />}
                            Send
                        </button>
                    </div>
                </motion.div>
            </div>
            {toast && (
                <div className="toast-success">
                    Warning sent to user
                </div>
            )}
        </>
    )
};