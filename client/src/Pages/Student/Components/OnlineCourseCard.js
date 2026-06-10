import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Teacher/Styles/OnlineCoursesDisplay.css'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg'
import { ReactComponent as RecurringIcon } from '../../../Assets/icons/CourseIcons/recurring.svg'
import { ReactComponent as OneTimeIcon } from '../../../Assets/icons/CourseIcons/one-time.svg'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'

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

export const OnlineCourseCard = ({ course }) => {
    const platform = PLATFORM_META[course?.platform] || PLATFORM_META.other
    const outdated = isOutdated(course?.schedule)
    const live = isLive(course?.schedule)

    const handleClick = (e) => {
        e.preventDefault()
        window.open(course.sessionUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <div
            className={`course-card ${outdated ? 'course-card--outdated' : ''}`}
            onClick={handleClick}
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
