import "../Styles/ReportItem.css";
import { motion } from "framer-motion";
import { ReactComponent as WarningIcon } from "../../Assets/icons/AdminIcons/warning.svg";
import axios from "axios";
import { useState } from "react";

export const ReportItem = ({ onClose, data }) => {
    const [formData, setFormData] = useState({
        about: data.type,
        refId: data.refId,
        refType: data.refType ?? null,
        message: ""
    });

    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(false)

    const handleReport = async () => {
    setLoading(true);
    try {
        await axios.post(
            `${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/reports`,
            formData
        );
        setToast(true);
        setTimeout(() => {
            setToast(false);
            onClose(); 
        }, 2000);
    } catch (error) {
        console.error(error.message);
    } finally {
        setLoading(false);
    }
};

    return (
        <>
            <div className="delete-overlay">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="report-popup"
                >
                    <div className="delete-popup__icon-wrap report">
                        <WarningIcon className="delete-popup__icon" />
                    </div>

                    <p className="delete-popup__title">Report content</p>
                    <p className="delete-popup__desc">
                        Help us understand why you are reporting this item.
                    </p>

                    <textarea
                        className="report-textarea"
                        placeholder="Describe the issue..."
                        value={formData.message}
                        onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                        }
                    />

                    <div className="delete-popup__actions">
                        <button className="delete-popup__btn cancel" onClick={onClose}>
                            Cancel
                        </button>

                        <button
                            className="delete-popup__btn report"
                            onClick={handleReport}
                            disabled={loading}
                        >
                            {loading && <span className="btn-spinner" />}
                            Submit report
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Toast OUTSIDE modal */}
            {toast && (
                <div className="toast-success">
                    Report sent successfully
                </div>
            )}
        </>
    );
};