import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/ConfirmParent.css";

export default function ConfirmParent() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");
    const parentEmail = searchParams.get("parentEmail");

    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [action, setAction] = useState(null);  
    const [message, setMessage] = useState("");

    const handleAction = async (selectedAction) => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing token.");
            return;
        }

        setAction(selectedAction);
        setStatus("loading");

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/auth/infos/child-approval`,
                { token, action: selectedAction }
            );
            setMessage(data.message);
            setStatus("success");
        } catch (err) {
            setMessage(
                err.response?.data?.error || "Something went wrong. Please try again."
            );
            setStatus("error");
        }
    };

    // ── Token missing entirely ───────────────────────────────
    if (!token) {
        return (
            <div className="cp-page">
                <div className="cp-card">
                    <div className="cp-icon cp-icon--error">
                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="cp-title">Invalid link</h1>
                    <p className="cp-subtitle">This confirmation link is invalid or has expired.</p>
                    <button className="cp-btn cp-btn--outline" onClick={() => navigate("/")}>
                        Go home
                    </button>
                </div>
            </div>
        );
    }

    // ── Success state ────────────────────────────────────────
    if (status === "success") {
        const approved = action === "approve";
        return (
            <div className="cp-page">
                <div className="cp-card">
                    <div className={`cp-icon ${approved ? "cp-icon--success" : "cp-icon--neutral"}`}>
                        {approved ? (
                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        )}
                    </div>
                    <h1 className="cp-title">
                        {approved ? "Link accepted!" : "Request declined"}
                    </h1>
                    <p className="cp-subtitle">{message}</p>
                    <button className="cp-btn cp-btn--primary" onClick={() => navigate("/")}>
                        Go to home
                    </button>
                </div>
            </div>
        );
    }

    // ── Error state ──────────────────────────────────────────
    if (status === "error") {
        return (
            <div className="cp-page">
                <div className="cp-card">
                    <div className="cp-icon cp-icon--error">
                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="cp-title">Something went wrong</h1>
                    <p className="cp-subtitle">{message}</p>
                    <button className="cp-btn cp-btn--outline" onClick={() => setStatus("idle")}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // ── Default: action prompt ───────────────────────────────
    return (
        <div className="cp-page">
            <div className="cp-card">

                {/* Icon */}
                <div className="cp-icon cp-icon--primary">
                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Heading */}
                <h1 className="cp-title">Parent link request</h1>
                <p className="cp-subtitle">
                    Someone is requesting to be linked as your parent on the platform.
                </p>

                {/* Parent email pill */}
                {parentEmail && (
                    <div className="cp-email-pill">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {parentEmail}
                    </div>
                )}

                {/* Info box */}
                <div className="cp-info-box">
                    <p>By accepting, this parent will be able to view your learning progress, enrollments, and assignment scores.</p>
                </div>

                {/* Actions */}
                <div className="cp-actions">
                    <button
                        className="cp-btn cp-btn--outline"
                        onClick={() => handleAction("refuse")}
                        disabled={status === "loading"}
                    >
                        {status === "loading" && action === "refuse" ? (
                            <span className="cp-spinner" />
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                Decline
                            </>
                        )}
                    </button>
                    <button
                        className="cp-btn cp-btn--primary"
                        onClick={() => handleAction("approve")}
                        disabled={status === "loading"}
                    >
                        {status === "loading" && action === "approve" ? (
                            <span className="cp-spinner cp-spinner--white" />
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Accept
                            </>
                        )}
                    </button>
                </div>

                <p className="cp-footer-note">
                    You can remove this link at any time from your account settings.
                </p>
            </div>
        </div>
    );
}