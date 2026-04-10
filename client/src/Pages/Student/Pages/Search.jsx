import React, { useState, useRef, useEffect } from 'react'
import '../Styles/Search.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { CourseCard } from '../../Teacher/Pages/MyCourses'

const CATEGORIES = [
    { id: 1, name: 'Mathematics', emoji: '📐' },
    { id: 2, name: 'Computer Science', emoji: '💻' },
    { id: 3, name: 'Physics', emoji: '⚛️' },
    { id: 4, name: 'Chemistry', emoji: '🧪' },
    { id: 5, name: 'Biology', emoji: '🧬' },
    { id: 6, name: 'History', emoji: '🏛️' },
    { id: 7, name: 'Geography', emoji: '🌍' },
    { id: 8, name: 'Literature', emoji: '📚' },
    { id: 9, name: 'Language Arts', emoji: '✍️' },
    { id: 10, name: 'Art & Design', emoji: '🎨' },
    { id: 11, name: 'Music', emoji: '🎵' },
    { id: 12, name: 'Philosophy', emoji: '🧠' },
    { id: 13, name: 'Economics', emoji: '📊' },
    { id: 14, name: 'Psychology', emoji: '🪞' },
    { id: 15, name: 'Engineering', emoji: '⚙️' },
    { id: 16, name: 'Medicine', emoji: '🩺' },
    { id: 17, name: 'Law', emoji: '⚖️' },
    { id: 18, name: 'Sports & PE', emoji: '🏃' },
]

// The student's interest category IDs would come from their profile / context
// For now we highlight them visually — pass them from your AppContext later
const STUDENT_INTEREST_IDS = [1, 2, 5, 13]

function SearchPage() {
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
            prev.find(c => c.id === cat.id)
                ? prev.filter(c => c.id !== cat.id)
                : [...prev, cat]
        )
    }

    const removeCategory = (id) => {
        setSelectedCats(prev => prev.filter(c => c.id !== id))
    }

    const handleSearch = () => {
        if (!query.trim() && selectedCats.length === 0) return
        setFocused(false)
        setLoading(true)
        setSearched(true)

        // Build your query params here when backend is ready:
        // const params = new URLSearchParams()
        // if (query)               params.set('title', query)
        // if (selectedCats.length) params.set('categories', selectedCats.map(c => c.id).join(','))
        // axios.get(`/search?${params}`).then(res => setResults(res.data)).finally(() => setLoading(false))

        // ── Simulated delay for now ──
        setTimeout(() => {
            setResults([]) // replace with real data
            setLoading(false)
        }, 800)
    }

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
                                    <button onClick={() => removeCategory(cat.id)}>✕</button>
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
                                {CATEGORIES.map(cat => {
                                    const isSelected = selectedCats.find(c => c.id === cat.id)
                                    const isInterest = STUDENT_INTEREST_IDS.includes(cat.id)
                                    return (
                                        <button
                                            key={cat.id}
                                            className={`dropdown-cat-chip
                                                ${isSelected ? 'chip--selected' : ''}
                                                ${isInterest && !isSelected ? 'chip--interest' : ''}
                                            `}
                                            onMouseDown={e => { e.preventDefault(); toggleCategory(cat) }}
                                        >
                                            <span>{cat.emoji}</span>
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
                {!searched && (
                    <div className="search-empty-state">
                        <span className="empty-icon">🔍</span>
                        <p>Start typing or pick a category to discover courses</p>
                    </div>
                )}

                {searched && loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Searching…</span>
                    </div>
                )}

                {searched && !loading && results.length === 0 && (
                    <div className="search-empty-state">
                        <span className="empty-icon">😕</span>
                        <p>No courses found for <strong>"{query}"</strong>{selectedCats.length > 0 && ` in ${selectedCats.map(c => c.name).join(', ')}`}</p>
                        <button className="search-clear-btn-alt" onClick={clearAll}>Clear search</button>
                    </div>
                )}

                {searched && !loading && results.length > 0 && (
                    <>
                        <div className="results-header">
                            <span>{results.length} course{results.length !== 1 ? 's' : ''} found</span>
                        </div>
                        <div className="courses-grid-container">
                            {results.map(course => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    onClick={() => { }}
                                    isSelected={false}
                                    typeView="Courses"
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default SearchPage