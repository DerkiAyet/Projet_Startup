import "../Styles/DeletePopup.css";
import { motion } from "framer-motion";
import { ReactComponent as WarningIcon } from "../../Assets/icons/AdminIcons/warning.svg";

export const DeleteConfirmPopup = ({ onClose, onDelete, title }) => (
    <div className="delete-overlay">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="delete-popup"
        >
            <div className="delete-popup__icon-wrap">
                <WarningIcon className="delete-popup__icon" />
            </div>
            <p className="delete-popup__title">{title}</p>
            <p className="delete-popup__desc">This action is permanent and cannot be undone.</p>

            <div className="delete-popup__actions">
                <button className="delete-popup__btn cancel" onClick={onClose}>Cancel</button>
                <button className="delete-popup__btn confirm" onClick={() => { onDelete(); onClose(); }}>Delete</button>
            </div>
        </motion.div>
    </div>
);