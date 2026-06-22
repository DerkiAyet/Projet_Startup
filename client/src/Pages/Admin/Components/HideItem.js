import "../Styles/WarningStyle.css";
import { motion } from "framer-motion";
import { ReactComponent as HideIcon } from "../../../Assets/icons/AdminIcons/hide.svg";
import axios from "axios";
import { useState } from "react";

export const HideItem = ({ onClose, type, refId, targetId, reportId, targetType }) => {
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(false)
    const [formData, setFormData] = useState({
        targetId: targetId,
        action: "hide",
        targetType: type,
        reason: ""
    });

    const handleReport = async () => {
        setLoading(true);
        try {
            //hide the item
            const hideLink = type === "post" ? `${process.env.REACT_APP_API_URL_GATEWAY}/posts/${refId}/hide` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/analytics/${targetType}/hide/${refId}`
            await axios.put(
                hideLink,
                {}
            );

            //push the action into moderate content
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/reports/${reportId}/moderate-content`,
                formData, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            )
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
                        <HideIcon className="delete-popup__icon" />
                    </div>

                    <p className="delete-popup__title">Hide Item</p>
                    <p className="delete-popup__desc">
                        The item will be hidden from the platform and the owner will be informed with your provided reason.
                    </p>

                    <textarea
                        className="report-textarea"
                        placeholder="Describe the issue..."
                        value={formData.reason}
                        onChange={(e) =>
                            setFormData({ ...formData, reason: e.target.value })
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
                            Hide
                        </button>
                    </div>
                </motion.div>
            </div>

            {toast && (
                <div className="toast-success">
                    Item is hidden now
                </div>
            )}
        </>
    );
};