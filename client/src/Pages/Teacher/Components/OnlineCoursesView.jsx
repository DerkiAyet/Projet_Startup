import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../Styles/OnlineCoursesDisplay.css'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg'
import { ReactComponent as RecurringIcon } from '../../../Assets/icons/CourseIcons/recurring.svg'
import { ReactComponent as OneTimeIcon } from '../../../Assets/icons/CourseIcons/one-time.svg'
import axios from 'axios'
import { AppContext } from '../../../App'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'

// ─── Helpers ─────────────────────────────────────────────────

const PLATFORM_META = {
    zoom: { label: "Zoom", color: "#2D8CFF", bg: "#EFF6FF" },
    google_meet: { label: "Google Meet", color: "#34A853", bg: "#F0FDF4" },
    youtube: { label: "YouTube", color: "#FF0000", bg: "#FEF2F2" },
    teams: { label: "Teams", color: "#5B5FC7", bg: "#EEF2FF" },
    other: { label: "Live Session", color: "#8E8E8E", bg: "#F4F6F8" },
}

const RECURRENCE_LABEL = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
}

const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatTime = (date) => {
    if (!date) return null
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const isLive = (schedule) => {
    if (!schedule?.startDate || !schedule?.endDate) return false
    const now = new Date()
    return now >= new Date(schedule.startDate) && now <= new Date(schedule.endDate)
}

const isOutdated = (schedule) => {
    if (!schedule?.endDate) return false
    return new Date(schedule.endDate) < new Date()
}

// ─── Detail Panel ─────────────────────────────────────────────

export const OnlineCourseDetailPanel = ({ course, onClose }) => {
    const { userAuth } = useContext(AppContext)
    const navigate = useNavigate()

    const isParticipant = course?.participants?.some(p => String(p.userId) === String(userAuth.userId))
    const isCreator = String(course?.creator.id) === String(userAuth.userId)
    const platform = PLATFORM_META[course?.platform] || PLATFORM_META.other
    const outdated = isOutdated(course?.schedule)
    const live = isLive(course?.schedule)

    const handleJoin = (e) => {
        e.preventDefault()
        if (!isParticipant) {
            axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/online-courses/${course._id}/join`,
                {},
                { headers: { "Content-Type": "application/json" } }
            ).catch(err => console.error(err))
        }
        window.open(course.sessionUrl, '_blank', 'noopener,noreferrer')
    }

    if (!course) return null

    return (
        <div className="course-detail-panel">
            <button className="detail-panel-close" onClick={onClose}>✕</button>

            <div className="detail-panel-img">
                {course.thumbnail
                    ? <img src={fixMediaUrl(course.thumbnail)} alt={course.title} />
                    : (
                        <div className="oc-platform-banner" style={{ background: platform.bg }}>
                            <span className="oc-platform-icon" style={{ color: platform.color }}>
                                {platform.label}
                            </span>
                        </div>
                    )
                }
                {live && <div className="oc-live-badge">🔴 Live Now</div>}
                {outdated && <div className="oc-outdated-badge">Ended</div>}
            </div>

            <div className="detail-panel-body">
                <span className="oc-platform-pill" style={{ color: platform.color, background: platform.bg }}>
                    {platform.label}
                </span>

                <h2 style={{ textTransform: "capitalize" }}>{course.title}</h2>
                <p className="detail-description">{course.description}</p>

                <div className="oc-schedule-block">
                    <div className="oc-schedule-row">
                        <span className="oc-schedule-label">Starts</span>
                        <span className="oc-schedule-val">
                            {formatDate(course.schedule?.startDate)} · {formatTime(course.schedule?.startDate)}
                        </span>
                    </div>
                    {course.schedule?.endDate && (
                        <div className="oc-schedule-row">
                            <span className="oc-schedule-label">Ends</span>
                            <span className="oc-schedule-val">
                                {formatDate(course.schedule?.endDate)} · {formatTime(course.schedule?.endDate)}
                            </span>
                        </div>
                    )}
                    {course.schedule?.recurring && (
                        <div className="oc-schedule-row">
                            <span className="oc-schedule-label">Repeats</span>
                            <span className="oc-schedule-val">
                                {RECURRENCE_LABEL[course.schedule?.recurrencePattern] || 'Recurring'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="detail-stats">
                    <div className="detail-stat">
                        <PeopleIcon />
                        <span>{course.participants?.length || 0} participants</span>
                    </div>
                </div>

                {!outdated ? (
                    isCreator ? (
                        <button className="enroll-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            You're the Creator
                        </button>
                    ) : (
                        <button className="enroll-btn" onClick={handleJoin}>
                            {isParticipant ? '▶ Join Session' : '▶ Enroll & Join'}
                        </button>
                    )
                ) : (
                    <button className="enroll-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        Session Ended
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Course Card ──────────────────────────────────────────────

export const OnlineCourseCard = ({ course, onClick, isSelected }) => {
    const platform = PLATFORM_META[course?.platform] || PLATFORM_META.other
    const outdated = isOutdated(course?.schedule)
    const live = isLive(course?.schedule)

    return (
        <div
            className={`course-card ${isSelected ? 'course-card--feature-cardselected' : ''} ${outdated ? 'course-card--outdated' : ''}`}
            onClick={() => onClick(course)}
        >
            <div className="course-img-box">
                {course.thumbnail
                    ? <img src={fixMediaUrl(course.thumbnail)} alt={course.title} />
                    : (
                        <div className="oc-card-banner" style={{ background: platform.bg }}>
                            <span style={{ color: platform.color, fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
                                {platform.label}
                            </span>
                        </div>
                    )
                }
                {live && <div className="oc-live-badge oc-live-badge--card">🔴 Live</div>}
                {outdated && <div className="oc-outdated-badge oc-outdated-badge--card">Ended</div>}
                <MenuIcon className="menu-card-icon" />
            </div>

            <div className="course-infos-box">
                <span className="oc-platform-pill" style={{ color: platform.color, background: platform.bg }}>
                    {platform.label}
                </span>

                <h3>{course.title}</h3>
                <h5 className='made-by' style={{ marginBottom: "6px" }}>
                    Instructor: {course?.creator?.givenName} {course?.creator?.familyName}
                </h5>


                {course.schedule?.startDate && (
                    <p className="oc-card-date">
                        📅 {formatDate(course.schedule.startDate)}
                        {course.schedule.recurring && (
                            <span className="oc-recurrence-pill">
                                {RECURRENCE_LABEL[course.schedule.recurrencePattern]}
                            </span>
                        )}
                    </p>
                )}

                <div className="course-features">
                    <div className="flex-left">
                        <div className="flex-line">
                            <PeopleIcon /> {course.participants?.length || 0}
                        </div>
                    </div>
                    <div className="flex-line" style={{ fontSize: '0.72rem', color: '#8E8E8E' }}>
                        {course.schedule?.recurring ?
                            <span
                                style={{ display: "flex", alignItems: "center", gap: "3px" }}
                            >
                                <RecurringIcon /> Recurring
                            </span> :
                            <span
                                style={{ display: "flex", alignItems: "center", gap: "3px" }}
                            > <OneTimeIcon /> One-time
                            </span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main View ────────────────────────────────────────────────

const ViewOnlineCourses = ({ courses, searched, loading, query }) => {
    const [selectedCourse, setSelectedCourse] = useState(null)

    const handleCardClick = (course) => {
        setSelectedCourse(prev => prev?._id === course._id ? null : course)
    }

    if (searched && !loading && courses.length === 0) {
        return (
            <div className="search-empty-state">
                <p>No online sessions found for <strong>"{query}"</strong></p>
            </div>
        )
    }

    return (
        <div className={`courses-grid-wrapper ${selectedCourse ? 'has-panel' : ''}`}>
            <div className="courses-grid-container">
                {courses.map(course => (
                    <OnlineCourseCard
                        key={course._id}
                        course={course}
                        onClick={handleCardClick}
                        isSelected={selectedCourse?._id === course._id}
                    />
                ))}
            </div>
            {selectedCourse && (
                <OnlineCourseDetailPanel
                    course={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                />
            )}
        </div>
    )
}

function OnlineCoursesView({ courses, searched, loading, query, teacherCourses }) {
    return (
        <div className="courses-container" onClick={() => { }}>
            <div className="courses-wrapper">
                {!searched && !teacherCourses && (
                    <div className="recommendations-line" style={{ display: 'flex', width: '100%', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #D9E1E7', paddingBottom: '0.5rem', fontFamily: 'Nunito, sans-serif', color: '#8A8A8A' }}>
                        Upcoming Sessions ~
                    </div>
                )}
                {loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>{searched ? 'Searching…' : 'Fetching sessions…'}</span>
                    </div>
                )}
                {!loading && (
                    <ViewOnlineCourses
                        courses={courses}
                        searched={searched}
                        loading={loading}
                        query={query}
                    />
                )}
            </div>
        </div>
    )
}

export default OnlineCoursesView