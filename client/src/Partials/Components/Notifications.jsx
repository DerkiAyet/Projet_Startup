import { useState, useEffect } from "react";
import "../Styles/Notifications.css";
import { ReactComponent as CloseIcon } from '../../Assets/icons/TimelineIcons/close.svg';
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

const TYPE_CONFIG = {
  REQUEST_LINK_PARENT_CHILD: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
      </svg>
    ),
    label: "Link Request",
    color: "#EC4899",
    bg: "#FDF2F8",
  },
  NEW_POST: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    label: "New Post",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  NEW_LIKE: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
      </svg>
    ),
    label: "Like",
    color: "#F43F5E",
    bg: "#FFF1F2",
  },
  NEW_COMMENT: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Comment",
    color: "#0EA5E9",
    bg: "#F0F9FF",
  },
  NEW_FOLLOW: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
      </svg>
    ),
    label: "Follow",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  NEW_REPLY: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 17l-5-5 5-5M20 18v-2a4 4 0 0 0-4-4H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Reply",
    color: "#0EA5E9",
    bg: "#F0F9FF",
  },
  URGENT_NOTIFICATION: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Urgent",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  NEW_MESSAGE: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: "Message",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  SYSTEM: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: "System",
    color: "#6B7280",
    bg: "#F9FAFB",
  },
};

// derive avatar initials + a stable color from the user object
const AVATAR_COLORS = ["#EC4899", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B", "#F43F5E", "#6366F1"];
const getAvatarColor = (id) => AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

const getInitials = (user) => {
  if (!user || user === "no sender") return "?";
  return `${user.givenName?.charAt(0) ?? ""}${user.familyName?.charAt(0) ?? ""}`.toUpperCase();
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
};

const FILTERS = ["All", "Unread"];

export default function Notifications({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [dismissing, setDismissing] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/get-notifications`
        );
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === "Unread") return !n.isRead;
    return true;
  });

  const markAllRead = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/mark-all-as-read`
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/mark-as-read/${id}`
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const dismiss = async (id) => {
    setDismissing(id);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/delete-notification/${id}`
      );
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setDismissing(null);
      }, 300);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setDismissing(null);
    }
  };

  const navigate = useNavigate()

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markRead(notif._id);

    if (notif.metadata.link) {
      if (notif.type === "REQUEST_LINK_PARENT_CHILD") {
        navigate(`${notif.metadata.link}&parentEmail=${notif.metadata.emailParent}`);
      }
      navigate(notif.metadata.link)
    }
  }

  return (
    <div className="notif-page">
      <div className="notif-wrapper">
        <CloseIcon className="close-icon" onClick={onClose} />

        <div className="notif-list-wrapper">
          <div className="notif-header">
            <div className="notif-header-left">
              <h1 className="notif-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount} new</span>
              )}
            </div>
            <button
              className="notif-mark-all-btn"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

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

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty"><p>Loading...</p></div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <p>No notifications here</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
                const initials = getInitials(notif.user);
                const avatarColor = getAvatarColor(notif.idSender ?? 0);

                return (
                  <div
                    key={notif._id}
                    className={`notif-item ${!notif.isRead ? "notif-item--unread" : ""} ${dismissing === notif._id ? "notif-item--dismissing" : ""}`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className="notif-dot-col">
                      {!notif.isRead && <span className="notif-unread-dot" />}
                    </div>

                    <div
                      className="notif-avatar"
                      style={{ background: avatarColor + "22", color: avatarColor }}
                    >
                      {notif.user?.userImg
                        ? <img src={notif.user.userImg} alt={initials} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : initials
                      }
                    </div>

                    <div className="notif-content">
                      <p className="notif-text">
                        {notif.user && notif.user !== "no sender" && (
                          <span className="notif-name">
                            {notif.user.givenName} {notif.user.familyName}{" "}
                          </span>
                        )}
                        {notif.message}
                      </p>
                      <div className="notif-meta">
                        <span
                          className="notif-type-badge"
                          style={{ color: config.color, background: config.bg }}
                        >
                          <span style={{ color: config.color }}>{config.icon}</span>
                          {config.label}
                        </span>
                        <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      className="notif-dismiss-btn"
                      onClick={(e) => { e.stopPropagation(); dismiss(notif._id); }}
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