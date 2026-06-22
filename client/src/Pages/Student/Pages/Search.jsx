import React, { useState, useRef, useEffect } from 'react'
import '../Styles/Search.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import CoursesView from '../Components/CoursesView'
import axios from 'axios'
import QuizSolve from '../Components/QuizSolve'
import RessourcePage from '../Components/RessourcePage'

function SearchPage() {

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
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const inputRef = useRef(null)
    const containerRef = useRef(null)

    // Close dropdown when clicking outside
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

    const [courses, setCourses] = useState([])
    const [assignments, setAssignments] = useState([])
    const [tips, setTips] = useState([])

    const [resources, setResources] = useState([])
    const [resourcePageOpen, setResourcePageOpen] = useState({
        visible: false,
        resource: null
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const [courseRes, assignRes, tipRes, resourceRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/recommended/me`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/recommended/me`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/tips/recommended/me`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/recommended/me`)
                ])

                setCourses(courseRes.data)

                setAssignments(assignRes.data)

                setTips(tipRes.data)

                setResources(resourceRes.data)

            } catch (error) {
                console.error("Error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSearch = async () => {
        if (!query.trim() && selectedCats.length === 0) return;

        setFocused(false);
        setLoading(true);
        setSearched(true);
        setResults([]);
        setCourses([]);
        setAssignments([]);
        setTips([]);

        //extract the category ids properly first
        const categoryIds = selectedCats.map(cat => cat.idSubject);
        const subcategoryNames = query.trim().split(/\s+/).filter(Boolean);

        const params = new URLSearchParams();
        params.set("title", query);
        if (subcategoryNames.length) params.set("subCategoryName", subcategoryNames.join(","));
        if (categoryIds.length) params.set("categoryId", categoryIds.join(","));

        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            const request = axios.get(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/search?${params.toString()}`
            );

            const requestRes = axios.get(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/search?${params.toString()}`
            );

            const [res, resourceRes] = await Promise.all([request, requestRes, minDelay]);
            const data = res.data;

            const filtered = {
                courses: data.filter(i => i.typeContent === "course"),
                assignments: data.filter(i => i.typeContent === "assignment"),
                tips: data.filter(i => i.typeContent === "tip")
            };

            setResults(data);
            setCourses(filtered.courses);
            setAssignments(filtered.assignments);
            setTips(filtered.tips);
            setResources(resourceRes.data)

        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch()
        if (e.key === 'Escape') setFocused(false)
    }

    const clearAll = () => {
        setQuery('')
        setSelectedCats([])
        setResults([])
        setSearched(false)
        inputRef.current?.focus()
    }

    const isExpanded = focused || selectedCats.length > 0

    return (
        <div className="search-page">

            {/* ─── Hero / search area ─────────────────────────── */}
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
                            placeholder="Search by title, topic, or pick a category"
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

            {/* ─── Results area ───────────────────────────────── */}
            <div className="search-results-area">
                <CoursesView
                    courses={courses}
                    assignments={assignments}
                    tips={tips}
                    resources={resources}
                    setResourcePageOpen={setResourcePageOpen}
                    searched={searched}
                    loading={loading}
                    query={query}
                    selectedCats={selectedCats.map(c => c.name).join(', ')}
                    setResources={setResources}
                />
            </div>

            {resourcePageOpen.visible &&
                <RessourcePage
                    selectedResource={resourcePageOpen.resource}
                    visible={resourcePageOpen.visible}
                    onClose={() => setResourcePageOpen({ visible: false, resource: null })}

                />}
        </div>
    )
}

export default SearchPage