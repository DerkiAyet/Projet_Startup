import React, { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../Styles/Calendar.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import ChartImg from '../../../Assets/images/chart-img.png'


const localizer = dateFnsLocalizer({
    format, parse, startOfWeek, getDay,
    locales: { 'en-US': enUS },
})

const EVENT_TYPES = {
    Lecture: { color: '#6FAEF0', light: '#E7F3FF' },
    Assessment: { color: '#F2C94C', light: '#FFF7D6' },
    Meeting: { color: '#F29DB6', light: '#FFE4EC' },
    Planning: { color: '#9FE8B4', light: '#DFF8E6' }
}

function CalendarPage() {
    const [events, setEvents] = useState([
        {
            title: "Algebra Lecture",
            start: new Date("2026-03-30T09:00:00"),
            end: new Date("2026-03-30T11:00:00"),
            type: "Lecture",
        },
        {
            title: "Midterm Assessment",
            start: new Date("2026-04-02T14:00:00"),
            end: new Date("2026-04-02T16:00:00"),
            type: "Assessment",
        },
        {
            title: "Weekly Teacher Meeting",
            start: new Date("2026-03-31T10:00:00"),
            end: new Date("2026-03-31T11:00:00"),
            type: "Meeting",
        },
        {
            title: "Lesson Planning Session",
            start: new Date("2026-04-01T13:00:00"),
            end: new Date("2026-04-01T15:00:00"),
            type: "Planning",
        },
        {
            title: "Student Support Session",
            start: new Date("2026-03-29T16:00:00"),
            end: new Date("2026-03-29T17:00:00"),
            type: "Support",
        }
    ]);


    const [modal, setModal] = useState(null)
    const [form, setForm] = useState({ title: '', type: 'Lecture', startTime: '09:00', endTime: '10:00' })

    const handleSelectSlot = ({ start }) => {
        setModal({ date: start })
        setForm({ title: '', type: 'Lecture', startTime: '09:00', endTime: '10:00' })
    }

    const handleSave = async () => {
        if (!form.title.trim()) return

        const [sh, sm] = form.startTime.split(':').map(Number)
        const [eh, em] = form.endTime.split(':').map(Number)

        const start = new Date(modal.date)
        start.setHours(sh, sm, 0)

        const end = new Date(modal.date)
        end.setHours(eh, em, 0)

        setEvents([...events, {
            title: form.title,
            start,
            end,
            type: form.type,
        }])

        // Prepare payload for backend
        // const payload = {
        //     title: form.title,
        //     type: form.type,
        //     date: modal.date.toISOString().split('T')[0], // "YYYY-MM-DD"
        //     startHour: form.startTime, // "HH:mm"
        //     endHour: form.endTime,     // "HH:mm"
        // };

        // try {
        //     const response = await fetch('https://your-backend.com/api/events', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify(payload),
        //     });

        //     if (!response.ok) {
        //         throw new Error('Failed to save event');
        //     }

        //     const result = await response.json();
        //     console.log('Event saved:', result);
        // } catch (error) {
        //     console.error(error);
        // }


        setModal(null)
    }

    // This is how react-big-calendar lets you style individual events
    const eventPropGetter = (event) => {
        const { color, light } = EVENT_TYPES[event.type] || EVENT_TYPES.Lecture
        return {
            style: {
                backgroundColor: light,
                color: color,
                border: `1.5px solid ${color}`,
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '0.78rem',
            }
        }
    }

    // Filter state for event types
    const [filters, setFilters] = useState({
        Lecture: true,
        Assessment: true,
        Meeting: true,
        Planning: true,
    });

    // Filter for "Show only upcoming events"
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

    // Filter events for the calendar
    const filteredEvents = events.filter(event => {
        // type filter
        if (!filters[event.type]) return false;

        // upcoming filter
        if (showUpcomingOnly && event.start < new Date()) return false;

        return true;
    });

    return (
        <div className='calendar-container'>
            <div className='calendar-wrapper'>
                <div className="calendar-top-container">
                    <div className="card">
                        <div className="title-card"> All schedule</div>
                        <div className="card-content">
                            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                                <h2 style={{ color: "#000" }}>15</h2>
                                <span style={{ color: "#8A8A8A", marginBottom: "3px" }}>Agenda</span>
                            </div>
                            <img src={ChartImg} alt="Chart" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="title-card" style={{ backgroundColor: "#6FAEF0", color: "#E7F3FF" }}> All Lectures</div>
                        <div className="card-content">
                            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                                <h2 style={{ color: "#000" }}>15</h2>
                                <span style={{ color: "#8A8A8A", marginBottom: "3px" }}>Agenda</span>
                            </div>
                            <img src={ChartImg} alt="Chart" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="title-card" style={{ backgroundColor: "#F2C94C", color: "#FFF7D6" }}> All Assessements</div>
                        <div className="card-content">
                            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                                <h2 style={{ color: "#000" }}>15</h2>
                                <span style={{ color: "#8A8A8A", marginBottom: "3px" }}>Agenda</span>
                            </div>
                            <img src={ChartImg} alt="Chart" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="title-card" style={{ backgroundColor: "#9FE8B4", color: "#DFF8E6" }}> All Planning</div>
                        <div className="card-content">
                            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                                <h2 style={{ color: "#000" }}>15</h2>
                                <span style={{ color: "#8A8A8A", marginBottom: "3px" }}>Agenda</span>
                            </div>
                            <img src={ChartImg} alt="Chart" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="title-card" style={{ backgroundColor: "#F29DB6", color: "#FFE4EC" }}> All Meetings</div>
                        <div className="card-content">
                            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                                <h2 style={{ color: "#000" }}>15</h2>
                                <span style={{ color: "#8A8A8A", marginBottom: "3px" }}>Agenda</span>
                            </div>
                            <img src={ChartImg} alt="Chart" />
                        </div>
                    </div>
                </div>
                <div className="calendar-bottom-container">
                    <div className="calendar-legend">
                        <div className="filter-header">
                            <h4>Filter</h4>
                            <CloseIcon style={{ cursor: 'pointer', width: "24px", height: "24px" }} onClick={() => {
                                setFilters({
                                    Lecture: true,
                                    Assessment: true,
                                    Meeting: true,
                                    Planning: true,
                                });
                                setShowUpcomingOnly(false);
                            }} />
                        </div>
                        <div className="legend-divider" />
                        <label className="filter-check">
                            <input
                                type="checkbox"
                                checked={showUpcomingOnly}
                                onChange={() => setShowUpcomingOnly(!showUpcomingOnly)}
                            />
                            <span>Show only upcoming events</span>
                        </label>
                        {/* Event type checkboxes */}
                        {Object.keys(EVENT_TYPES).map(type => (
                            <label key={type} className="filter-check">
                                <input
                                    type="checkbox"
                                    checked={filters[type]}
                                    onChange={() =>
                                        setFilters({ ...filters, [type]: !filters[type] })
                                    }
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                        <div className="legend-divider" />
                        {/* --- ORIGINAL LEGEND --- */}
                        <h4>Category</h4>
                        {Object.entries(EVENT_TYPES).map(([type, { color }]) => (
                            <div key={type} className="event-type-line">
                                <div className="color-box" style={{ backgroundColor: color }} />
                                <span className="legend-item">{type}</span>
                            </div>
                        ))}
                    </div>
                    <Calendar
                        className='react-calendar'
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 800 }}
                        defaultView="month"
                        selectable
                        onSelectSlot={handleSelectSlot}
                        eventPropGetter={eventPropGetter}  // ← applies per-event styles
                    />
                    <div className="the-coming-events">
                        <h3>Upcoming Events</h3>
                        {events
                            .filter(e => e.start > new Date())
                            .sort((a, b) => a.start - b.start)
                            .slice(0, 5)
                            .map((e, idx) => (
                                <div key={idx} className="upcoming-event">
                                    <div className="event-color" style={{ backgroundColor: EVENT_TYPES[e.type]?.color || '#6FAEF0' }} />
                                    <div>
                                        <p className="event-title">{e.title}</p>
                                        <p className="event-time">{format(e.start, 'MMM d, yyyy, h:mm a')}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>New Event</h3>
                        <p className="modal-date">{format(modal.date, 'MMM d, yyyy')}</p>

                        {/* Title */}
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                placeholder="Event title..."
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                autoFocus
                            />
                        </div>

                        {/* Type selector */}
                        <div className="form-group">
                            <label>Type</label>
                            <div className="type-selector">
                                {Object.entries(EVENT_TYPES).map(([type, { color, light }]) => (
                                    <button
                                        key={type}
                                        className={`type-btn ${form.type === type ? 'selected' : ''}`}
                                        style={{
                                            background: form.type === type ? light : 'transparent',
                                            color: form.type === type ? color : '#888',
                                            border: `1.5px solid ${form.type === type ? color : '#e0e0e0'}`,
                                        }}
                                        onClick={() => setForm({ ...form, type })}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time range */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Start time</label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>End time</label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button
                                className="btn-save"
                                style={{ background: EVENT_TYPES[form.type].color }}
                                onClick={handleSave}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalendarPage

// Remarque!!!!!

// // in the backend:
// {
//   title: "Algebra Lecture",
//   date: "2026-03-30",
//   startHour: "09:00",
//   endHour: "11:00",
//   type: "Lecture"
// }

// // Frontend before passing to react-big-calendar
// const eventForCalendar = {
//   title: e.title,
//   type: e.type,
//   start: new Date(`${e.date}T${e.startHour}:00`),
//   end: new Date(`${e.date}T${e.endHour}:00`)
// };