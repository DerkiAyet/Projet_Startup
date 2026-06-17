import React, { useState, useRef, useEffect } from 'react'
import '../Styles/Classroom.css'
import axios from 'axios'
import { AddClassroomForm } from '../Components/AddClassroom';
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as UsersIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as FileTextIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as CheckCircleIcon } from '../../../Assets/icons/CourseIcons/done-icon.svg'
import { useContext } from 'react';
import { AppContext } from '../../../App';
import { useNavigate } from 'react-router-dom';
import NotFound from '../../../Assets/images/find-course.png'

const getInitials = (name = '') =>
    `${name.charAt(0)}`.toUpperCase();

const CLASSROOM_COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getClassroomColor = (classroomId) => {
    const index = parseInt(String(classroomId).slice(-4), 16) % CLASSROOM_COLORS.length;
    return CLASSROOM_COLORS[index];
};

const ClassroomCard = ({ color, classroom, active, isMember, alreadyRequested, sendRequest }) => {
    const { userAuth } = useContext(AppContext);
    const initials = getInitials(classroom.name);
    const navigate = useNavigate()

    const isCreator = userAuth?.userId 
    ? String(userAuth.userId) === String(classroom?.creator?.id)
    : false; 

    const dateOnly = classroom?.createdAt
        ? new Date(classroom.createdAt).toLocaleDateString()
        : null;

    const handleClick = () => {
        console.log("userId:", userAuth.userId, "creator id:", classroom?.creator?.id)
        if (isMember || isCreator) {
            navigate(`/classrooms/${classroom._id}`)
        } else {
            alert("Unauthorized: you're not a member to this classroom or not even the creator")
        }
    }

    return (
        <div className={`classroom-card ${active ? "--active" : ""}`} onClick={handleClick}>
            <MenuIcon className="menu-card-icon" />

            <div className="cr-card-header">
                <div className="cr-avatar-new" style={{ background: `${color}18`, color: color }}>
                    {initials}
                </div>
                <div>
                    <p className="cr-card-name">{classroom.name}</p>
                    <p className="cr-card-teacher">{classroom.creator.givenName} {classroom.creator.familyName}</p>
                </div>
            </div>

            <div className="cr-divider" />

            <div className="cr-meta">
                <div className="cr-meta-item">
                    <UsersIcon size={14} />
                    {classroom.members.length} students
                </div>
                <div className="cr-meta-item">
                    <FileTextIcon size={14} />
                    {classroom.posts?.length ?? 0} posts
                </div>
            </div>

            <div className="cr-card-footer" style={{marginTop: "auto"}}>
                <span className="cr-date">{dateOnly || ""}</span>

                {userAuth.role === "student" && isMember && (
                    <div className="cr-enrolled">
                        <CheckCircleIcon size={13} />
                        Enrolled
                    </div>
                )}

                {userAuth.role === "student" && !isMember && (
                    <button
                        className={`cr-btn ${alreadyRequested ? "sent" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!alreadyRequested) sendRequest(classroom._id);
                        }}
                        disabled={alreadyRequested}
                    >
                        {alreadyRequested ? "✓ Requested" : "Send request"}
                    </button>
                )}
            </div>
        </div>
    );
};

function Classroom() {

    const [categories, setCategories] = useState([])

    useEffect(() => {
        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/infos/get-subjects`)
            .then((res) => setCategories(res.data))
            .catch((err) => console.error(err.response.data))
    }, [])

    const [studentIntrests, setStudentsIntrests] = useState([])

    useEffect(() => {
        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-user-intrests`)
            .then((res) => setStudentsIntrests(res.data))
            .catch((err) => console.error(err.response.data))
    }, [])

    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const [selectedCats, setSelectedCats] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const inputRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setFocused(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggleCategory = (cat) => {
        setSelectedCats((prev) =>
            prev.find(c => c.idSubject === cat.idSubject)
                ? prev.filter(c => c.idSubject !== cat.idSubject)
                : [...prev, cat]
        )
    }

    const removeCategory = (id) => {
        setSelectedCats(prev => prev.filter(c => c.idSubject !== id))
    }

    const [classrooms, setClassrooms] = useState([])
    const { userAuth } = useContext(AppContext)
    const [getFromRecommendations, setGetFromRecommendations] = useState(false)


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const classroomsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/my-classrooms`)
                setClassrooms(classroomsRes.data)

                if (classroomsRes.data.length === 0 && userAuth.role === "student") {
                    try {
                        const recommendations = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/recommended/me`)
                        setClassrooms(recommendations.data)
                        setGetFromRecommendations(true)
                    } catch (error) {
                        console.error("Error:", error.message)
                    }
                }

            } catch (error) {
                console.error("Error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [userAuth.role])

    const handleSearch = async () => {
        try {
            if (!query.trim() && selectedCats.length === 0) return;

            setFocused(false);
            setLoading(true);
            setSearched(true);
            setClassrooms([])

            const categoryIds = selectedCats.map(cat => cat.idSubject);

            const params = new URLSearchParams();
            params.set("title", query);
            if (categoryIds.length) params.set("categoryId", categoryIds.join(","));
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/search?${params.toString()}`
            )
            setClassrooms(res.data)
            setLoading(false)
        } catch (err) {
            console.error(err.message)
        } finally {
            setLoading(false)
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch()
        if (e.key === 'Escape') setFocused(false)
    }

    const clearAll = async () => {
        setQuery('')
        setSelectedCats([])
        setSearched(false)
        inputRef.current?.focus()

        try {
            setLoading(true)
            const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/my-classrooms`)
            setClassrooms(res.data)

            if (res.data.length === 0 && userAuth.role === "student") {
                const recommendations = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/recommended/me`)
                setClassrooms(recommendations.data)
                setGetFromRecommendations(true)
            } else {
                setGetFromRecommendations(false)
            }
        } catch (err) {
            console.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const isExpanded = focused || selectedCats.length > 0

    const [addClassroomClicked, setAddClassroomClicked] = useState(false)

    const sendRequest = async (classroomId) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/send-request`)

            const newPendingRequest = {
                student: {
                    userId: userAuth.userId,
                    userName: userAuth.userName,
                    familyName: userAuth.familyName,
                    givenName: userAuth.givenName,
                    userImg: userAuth.userImg,
                    role: "student"
                }
            }

            setClassrooms((prev) =>
                prev.map((c) =>
                    c._id === classroomId
                        ? { ...c, pendingRequests: [...(c.pendingRequests || []), newPendingRequest] }
                        : c
                )
            )
        } catch (error) {
            console.log(error.message)
        }
    }

    return (
        <div className='cr-container'>
            <div className="cr-wrapper">
                <div className="search-hero">
                    {/* ── Search bar wrapper ── */}
                    <div
                        ref={containerRef}
                        className={`search-bar-wrapper ${isExpanded ? 'expanded' : ''}`}
                    >
                        {/* ── Input row ── */}
                        <div className="search-input-row">
                            <SearchIcon className="search-bar-icon" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search by name, teacher, or pick a category"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onKeyDown={handleKeyDown}
                                className="search-input"
                            />
                            {(query || selectedCats.length > 0) && (
                                <button className="search-clear-btn" onClick={clearAll} title="Clear">✕</button>
                            )}
                            <button
                                className={`search-go-btn ${(query || selectedCats.length > 0) ? 'active' : ''}`}
                                onClick={handleSearch}
                            >
                                Search
                            </button>
                        </div>
                        {/* ── Selected category pills (always visible when any selected) ── */}
                        {selectedCats.length > 0 && (
                            <div className="search-selected-pills">
                                {selectedCats.map(cat => (
                                    <span key={cat.id} className="selected-pill">
                                        {cat.emoji} {cat.name}
                                        <button onClick={() => removeCategory(cat.idSubject)}>✕</button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* ── Category dropdown (shows on focus) ── */}
                        {focused && (
                            <div className="search-category-dropdown">
                                <p className="dropdown-label">
                                    {selectedCats.length > 0 ? 'Add more categories' : 'Browse by category'}
                                </p>
                                <div className="dropdown-cats-grid">
                                    {categories.map(cat => {
                                        const isSelected = selectedCats.find(c => c.idSubject === cat.idSubject)
                                        const isInterest = studentIntrests.includes(cat.idSubject)
                                        return (
                                            <button
                                                key={cat.id}
                                                className={`dropdown-cat-chip
                                                ${isSelected ? 'chip--selected' : ''}
                                                ${isInterest && !isSelected ? 'chip--interest' : ''}
                                            `}
                                                onMouseDown={e => { e.preventDefault(); toggleCategory(cat) }}
                                            >
                                                {/* <span>{cat.emoji}</span> */}
                                                <span>{cat.name}</span>
                                                {isSelected && <span className="chip-check">✓</span>}
                                                {isInterest && !isSelected && (
                                                    <span className="chip-interest-dot" title="Matches your interests" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {!searched && loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Fetching Data...</span>
                    </div>
                )}

                {searched && loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Searching…</span>
                    </div>
                )}

                {
                    !loading && getFromRecommendations && <div className="recommendations-line" style={{ display: "flex", width: "100%", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #D9E1E7", paddingBottom: "0.5rem", fontFamily: "Nunito, sans serif", color: "#8A8A8A", padding: "0 1rem", marginTop: "0.5rem" }}>
                        Recommended for you ~
                    </div>
                }

                {
                    !loading && !getFromRecommendations && !searched && <div className="recommendations-line" style={{ display: "flex", width: "100%", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #D9E1E7", paddingBottom: "0.5rem", fontFamily: "Nunito, sans serif", color: "#8A8A8A", padding: "0 1rem", marginTop: "0.5rem" }}>
                        Your Classrooms ~
                    </div>
                }

                <div className="cr-body">
                    {
                        searched && !loading && classrooms.length === 0 ?
                            (
                                <div className="search-empty-state">
                                    <img src={NotFound} alt="not found" style={{ width: "200px" }} />
                                    <p>No classrooms found for <strong>"{query}"</strong>{categories.length > 0 && ` in ${selectedCats.map(c => c.name).join(', ')}`}
                                    </p>
                                </div>
                            )
                            : (
                                <div className="cr-list">
                                    {
                                        userAuth.role === "teacher" && !loading &&
                                        <AddClassroom onAdd={() => setAddClassroomClicked(true)} />
                                    }

                                    {
                                        classrooms.map((classroom) => {
                                            const isMemeber = userAuth.role === "student" ? (classroom?.members?.some((m) => String(m.id) === String(userAuth.userId))) : false
                                            const alreadyRequested = userAuth.role === "student" ? (classroom?.pendingRequests?.some((r) => String(r.student.userId) === String(userAuth.userId))) : false
                                            return (
                                                <ClassroomCard
                                                    color={getClassroomColor(classroom._id)}
                                                    classroom={classroom}
                                                    isMember={isMemeber}
                                                    alreadyRequested={alreadyRequested}
                                                    sendRequest={sendRequest}
                                                />
                                            )
                                        })
                                    }
                                </div>
                            )
                    }
                </div>

                {
                    addClassroomClicked && <AddClassroomForm onClose={() => setAddClassroomClicked(false)} classroomAdded={(newClassroom) => setClassrooms([...classrooms, newClassroom])} />
                }
            </div>
        </div>
    )
}

const AddClassroom = ({ onAdd }) => (
    <div className="add-classroom-card" onClick={onAdd} role="button" tabIndex={0}>
        <svg className="add-squiggle" viewBox="0 0 44 18" fill="none" aria-hidden="true">
            <path
                d="M2 9 Q8 2 15 9 Q22 16 29 9 Q36 2 42 9"
                stroke="#EC4899"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
        <div className="add-circle">+</div>
        <h4 className="add-title">Add Classroom</h4>
        <p className="add-sub">Create New Classroom</p>
    </div>
);

export default Classroom
