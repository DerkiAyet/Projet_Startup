import { useState } from "react";
import "../Styles/Notifications.css";
import { ReactComponent as CloseIcon } from '../../Assets/icons/TimelineIcons/close.svg'


const NOTIF_DATA = [
  {
    id: 1,
    type: "enrollment",
    avatar: "SA",
    avatarColor: "#EC4899",
    name: "Sara Amrani",
    message: "enrolled in your course",
    target: "Introduction to Calculus",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "review",
    avatar: "YB",
    avatarColor: "#8B5CF6",
    name: "Yacine Benali",
    message: "left a 5-star review on",
    target: "Advanced Algorithms",
    time: "14 min ago",
    read: false,
  },
  {
    id: 3,
    type: "comment",
    avatar: "LM",
    avatarColor: "#0EA5E9",
    name: "Lina Merabet",
    message: "commented on lesson 3 of",
    target: "Linear Algebra Basics",
    time: "1 hr ago",
    read: false,
  },
  {
    id: 4,
    type: "achievement",
    avatar: "KD",
    avatarColor: "#F59E0B",
    name: "Karim Djebari",
    message: "completed your course",
    target: "Python for Beginners",
    time: "3 hrs ago",
    read: true,
  },
  {
    id: 5,
    type: "enrollment",
    avatar: "NB",
    avatarColor: "#10B981",
    name: "Nadia Bouzid",
    message: "enrolled in your course",
    target: "Organic Chemistry 101",
    time: "Yesterday",
    read: true,
  },
  {
    id: 6,
    type: "comment",
    avatar: "HT",
    avatarColor: "#EC4899",
    name: "Hamza Tali",
    message: "asked a question in",
    target: "World History: Modern Era",
    time: "Yesterday",
    read: true,
  },
  {
    id: 7,
    type: "review",
    avatar: "RA",
    avatarColor: "#6366F1",
    name: "Rania Aouina",
    message: "left a review on",
    target: "English Grammar Masterclass",
    time: "2 days ago",
    read: true,
  },
  {
    id: 8,
    type: "achievement",
    avatar: "MB",
    avatarColor: "#F43F5E",
    name: "Mohamed Bensalem",
    message: "earned a certificate from",
    target: "Data Structures & Algorithms",
    time: "3 days ago",
    read: true,
  },
];

const TYPE_CONFIG = {
  enrollment: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
      </svg>
    ),
    label: "Enrollment",
    color: "#EC4899",
    bg: "#FDF2F8",
  },
  review: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
      </svg>
    ),
    label: "Review",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  comment: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Comment",
    color: "#0EA5E9",
    bg: "#F0F9FF",
  },
  achievement: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Achievement",
    color: "#10B981",
    bg: "#ECFDF5",
  },
};

const FILTERS = ["All", "Unread", "Enrollment", "Review", "Comment", "Achievement"];

export default function Notifications({ onClose }) {
  const [notifications, setNotifications] = useState(NOTIF_DATA);
  const [activeFilter, setActiveFilter] = useState("All");
  const [dismissing, setDismissing] = useState(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.read;
    return n.type === activeFilter.toLowerCase();
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismiss = (id) => {
    setDismissing(id);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setDismissing(null);
    }, 300);
  };

  return (
    <div className="notif-page">
      <div className="notif-wrapper">
        <CloseIcon className="close-icon" onClick={() => onClose()} />

        <div className="notif-list-wrapper">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <h1 className="notif-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount} new</span>
              )}
            </div>
            <button className="notif-mark-all-btn" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all as read
            </button>
          </div>
          {/* Filter tabs */}
          <div className="notif-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`notif-filter-btn ${activeFilter === f ? "notif-filter-btn--active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {/* List */}
          <div className="notif-list">
            {filtered.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <p>No notifications here</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const config = TYPE_CONFIG[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${!notif.read ? "notif-item--unread" : ""} ${dismissing === notif.id ? "notif-item--dismissing" : ""}`}
                    onClick={() => markRead(notif.id)}
                  >
                    {/* Unread dot */}
                    <div className="notif-dot-col">
                      {!notif.read && <span className="notif-unread-dot" />}
                    </div>
                    {/* Avatar */}
                    <div
                      className="notif-avatar"
                      style={{ background: notif.avatarColor + "22", color: notif.avatarColor }}
                    >
                      {notif.avatar}
                    </div>
                    {/* Content */}
                    <div className="notif-content">
                      <p className="notif-text">
                        <span className="notif-name">{notif.name}</span>{" "}
                        {notif.message}{" "}
                        <span className="notif-target">"{notif.target}"</span>
                      </p>
                      <div className="notif-meta">
                        <span
                          className="notif-type-badge"
                          style={{ color: config.color, background: config.bg }}
                        >
                          <span style={{ color: config.color }}>{config.icon}</span>
                          {config.label}
                        </span>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </div>
                    {/* Dismiss */}
                    <button
                      className="notif-dismiss-btn"
                      onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                      title="Dismiss"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}