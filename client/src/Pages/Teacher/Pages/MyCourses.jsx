import React, { useState, useContext, useEffect } from 'react'
import '../Styles/Courses.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as ArrowDown } from '../../../Assets/icons/CourseIcons/arrow-down.svg'
import { ReactComponent as ChartIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/CourseIcons/comment-course.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as GridIcon } from '../../../Assets/icons/CourseIcons/grid-mode.svg'
import { ReactComponent as LineIcon } from '../../../Assets/icons/CourseIcons/line-mode.svg'
import { AppContext } from '../../../App'
import axios from 'axios'
import { Link } from 'react-router-dom'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockCourses = [
    {
        _id: '1',
        teacherId: 101,
        title: 'Introduction to Algebra',
        description: 'A comprehensive introduction to algebraic thinking. You will learn about variables, equations, inequalities, and functions. By the end of this course, you will be able to solve linear equations, graph lines, and understand the foundations needed for higher-level mathematics.',
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=60',
        level: 'Beginner',
        category: { id: 1, subCategory: 2 },
        lessons: [
            { title: 'What is a Variable?', content: '...' },
            { title: 'Solving Linear Equations', content: '...' },
        ],
        ratings: [
            { userId: 1, rating: 4.5, ratedAt: new Date() },
            { userId: 2, rating: 5, ratedAt: new Date() },
        ],
        tags: ['math', 'algebra', 'beginner'],
        visibility: true,
        categoryName: 'Mathematics',
        studentsEnrolled: 45,
        commentsCount: 12,
    },
    {
        _id: '2',
        teacherId: 102,
        title: 'Advanced Python Programming',
        description: 'Dive deep into Python with topics covering decorators, generators, async programming, and design patterns. This course is designed for developers who already know the basics and want to write cleaner, faster, and more Pythonic code.',
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=500&q=60',
        level: 'Advanced',
        category: { id: 2, subCategory: 1 },
        lessons: [
            { title: 'Decorators Deep Dive', content: '...' },
            { title: 'Async & Await', content: '...' },
            { title: 'Design Patterns in Python', content: '...' },
        ],
        ratings: [
            { userId: 3, rating: 4, ratedAt: new Date() },
            { userId: 4, rating: 5, ratedAt: new Date() },
            { userId: 5, rating: 4.5, ratedAt: new Date() },
        ],
        tags: ['python', 'programming', 'advanced'],
        visibility: true,
        categoryName: 'Computer Science',
        studentsEnrolled: 128,
        commentsCount: 34,
    },
    {
        _id: '3',
        teacherId: 103,
        title: 'World History: Ancient Civilizations',
        description: 'Explore the rise and fall of ancient civilizations from Mesopotamia to Rome. This course covers key events, cultural achievements, trade routes, and the philosophical legacies that shaped the modern world.',
        thumbnail: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=500&q=60',
        level: 'Intermediate',
        category: { id: 3, subCategory: 1 },
        lessons: [
            { title: 'Mesopotamia & The Fertile Crescent', content: '...' },
            { title: 'Ancient Egypt', content: '...' },
            { title: 'Greece & Rome', content: '...' },
            { title: 'Trade Routes of the Ancient World', content: '...' },
        ],
        ratings: [
            { userId: 6, rating: 3.5, ratedAt: new Date() },
            { userId: 7, rating: 4, ratedAt: new Date() },
        ],
        tags: ['history', 'civilizations', 'ancient'],
        visibility: true,
        categoryName: 'History',
        studentsEnrolled: 67,
        commentsCount: 21,
    },
    {
        _id: '4',
        teacherId: 104,
        title: 'Introduction to Chemistry',
        description: 'Learn the building blocks of chemistry: atomic structure, the periodic table, chemical bonding, reactions, and stoichiometry. Ideal for students preparing for high school or college-level chemistry exams.',
        thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=500&q=60',
        level: 'Beginner',
        category: { id: 4, subCategory: 2 },
        lessons: [
            { title: 'Atomic Structure', content: '...' },
            { title: 'The Periodic Table', content: '...' },
        ],
        ratings: [
            { userId: 8, rating: 5, ratedAt: new Date() },
        ],
        tags: ['chemistry', 'science', 'beginner'],
        visibility: true,
        categoryName: 'Science',
        studentsEnrolled: 89,
        commentsCount: 8,
    },
    {
        _id: '5',
        teacherId: 105,
        title: 'Creative Writing Fundamentals',
        description: 'Unlock your storytelling potential. This course walks you through character development, plot structure, dialogue, point of view, and revision strategies. By the end, you will have completed a short story ready for feedback.',
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=60',
        level: 'Beginner',
        category: { id: 5, subCategory: 3 },
        lessons: [
            { title: 'Finding Your Voice', content: '...' },
            { title: 'Character Development', content: '...' },
            { title: 'Plot & Structure', content: '...' },
        ],
        ratings: [
            { userId: 9, rating: 4.5, ratedAt: new Date() },
            { userId: 10, rating: 4, ratedAt: new Date() },
        ],
        tags: ['writing', 'creative', 'storytelling'],
        visibility: true,
        categoryName: 'Language Arts',
        studentsEnrolled: 54,
        commentsCount: 19,
    },
    {
        _id: '6',
        teacherId: 106,
        title: 'Data Structures & Algorithms',
        description: 'Master the core computer science concepts that power efficient software. This course covers arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming — all with real-world examples and coding exercises.',
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=500&q=60',
        level: 'Intermediate',
        category: { id: 2, subCategory: 2 },
        lessons: [
            { title: 'Arrays & Linked Lists', content: '...' },
            { title: 'Trees & Graphs', content: '...' },
            { title: 'Sorting Algorithms', content: '...' },
            { title: 'Dynamic Programming', content: '...' },
        ],
        ratings: [
            { userId: 11, rating: 5, ratedAt: new Date() },
            { userId: 12, rating: 4.5, ratedAt: new Date() },
            { userId: 13, rating: 5, ratedAt: new Date() },
        ],
        tags: ['dsa', 'algorithms', 'cs'],
        visibility: true,
        categoryName: 'Computer Science',
        studentsEnrolled: 203,
        commentsCount: 47,
    },
]


// ─── Helpers ──────────────────────────────────────────────────────────────────
const averageRating = (ratings) => {
    if (!ratings.length) return 0
    const total = ratings.reduce((sum, r) => sum + r.rating, 0)
    return +(total / ratings.length).toFixed(1)
}

const StarRating = ({ rating }) => {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
                >
                    ★
                </span>
            ))}
            <span className="rating-value">{rating}</span>
        </div>
    )
}

// ─── Grid Detail Panel ────────────────────────────────────────────────────────
const CourseDetailPanel = ({ course, onClose, typeView }) => {

    const { userAuth } = useContext(AppContext)
    const userRole = userAuth.role

    if (!course) return null
    const avg = averageRating(course.avgRating)

    const content = typeView === "Courses" ? course.lessons : course.exercises

    return (
        <div className="course-detail-panel">
            <button className="detail-panel-close" onClick={onClose}>✕</button>
            <div className="detail-panel-img">
                <img src={course.thumbnail} alt={course.title} />
                <div className="detail-panel-level">
                    <ChartIcon /> {course.level}
                </div>
            </div>
            <div className="detail-panel-body">
                <span className="course-cat" style={{ color: `#${course.category.color}` }}>{course.category.name} - {course.subCategory.name} </span>
                <h2>{course.title}</h2>
                <StarRating rating={avg} />
                <p className="detail-description">{course.description}</p>

                <div className="detail-stats">
                    <div className="detail-stat">
                        <PeopleIcon />
                        <span>{typeView === "Courses" ? `${course.enrollCount} students enrolled the course` : `${course.solveCount} students solved the assignment`}</span>
                    </div>
                    <div className="detail-stat">
                        <CommentIcon />
                        <span>{course.commentsCount} comments</span>
                    </div>
                    {typeView !== "Tips" &&
                        <div className="detail-stat">
                            <LessonIcon />
                            <span>{typeView === "Courses" ? `${course.lessons.length} lessons` : `${course.exercises.length} exercises`}</span>
                        </div>}
                </div>

                {typeView !== "Tips" && <div className="detail-lessons">
                    <h4>{typeView === "Courses" ? "Lessons" : "Exercices"}</h4>
                    <ul>
                        {content.map((lesson, i) => (
                            <li key={i}>
                                <span className="lesson-number">{i + 1}</span>
                                {lesson.title}
                            </li>
                        ))}
                    </ul>
                </div>}

                <div className="detail-tags">
                    {course.tags.map((tag, i) => (
                        <span key={i} className="tag-pill">#{tag}</span>
                    ))}
                </div>

                {(userRole === "teacher") ? (
                    typeView === "Courses" ? <Link className="enroll-btn" to={`/courses/${course._id}?type=course`}>Go to Course</Link> : <Link className="enroll-btn" to={`/courses/${course._id}?type=assignment`}>Go To Assignment</Link>
                ) : (
                    typeView === "Courses" ? <button className="enroll-btn">Enroll Now</button> : <button className="enroll-btn">Solve Now</button>
                )}

            </div>
        </div>
    )
}

// ─── Course Card (Grid) ───────────────────────────────────────────────────────
export const CourseCard = ({ course, onClick, isSelected, typeView }) => {
    return (
        <div
            className={`course-card ${isSelected ? 'course-card--feature-cardselected' : ''}`}
            onClick={() => onClick(course)}
        >
            <div className="course-img-box">
                <img src={course.thumbnail} alt={course.title} />
                {
                    typeView !== "Tips" &&
                    <div className="level-box">
                        <ChartIcon />
                        {course.level}
                    </div>}
                <MenuIcon className="menu-card-icon" />
            </div>
            <div className="course-infos-box">
                <span className='course-cat'>{course.category.name} - {course.subCategory.name} </span>
                <h3>{course.title}</h3>
                <div className="course-features">
                    <div className="flex-left">
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <PeopleIcon /> {typeView === "Courses" ? `${course.enrollCount}+` : typeView === "Assignments" ? `${course.solveCount}+` : `${course.views}+`}
                        </div>
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <CommentIcon /> {course.commentsCount}+
                        </div>
                    </div>
                    <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <LessonIcon /> {typeView === "Courses" ? `${course.lessons.length}` : `${course.exercises.length}`}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Course Card (Line / Row) ─────────────────────────────────────────────────
const CourseCardLine = ({ course, typeView }) => {
    const [expanded, setExpanded] = useState(false)
    const avg = averageRating(course.avgRating)
    const { userAuth } = useContext(AppContext)
    const userRole = userAuth.role
    const content = typeView === "Courses" ? course.lessons : course.exercises
    return (
        <div className={`course-card-line ${expanded ? 'course-card-line--expanded' : ''}`} onClick={() => setExpanded((prev) => !prev)}>
            {/* ── Always-visible row ── */}
            <div className="card-row-left">
                <div className="course-img-row-box">
                    <img src={course.thumbnail} alt={course.title} />
                </div>
                <div className="course-infos-box">
                    <div className="top-wrapper">
                        <h3>{course.title}</h3>
                        <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category.name} - {course.subCategory.name} </span>
                    </div>
                    <div className="course-features">
                        <div className="flex-left">
                            <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <ChartIcon /> {course.level}
                            </div>
                            <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <PeopleIcon /> {typeView === "Courses" ? `${course.enrollCount} students enrolled` : typeView === "Assignments" ? `${course.solveCount} students solved` : "Viewed the tip"}
                            </div>
                            <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <CommentIcon /> {course.commentsCount} comments
                            </div>
                            {
                                typeView !== "Tips" &&
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <LessonIcon /> {typeView === "Courses" ? `${course.lessons.length} lessons` : `${course.exercises.length} Exercises`}
                                </div>
                            }

                        </div>
                    </div>
                </div>
            </div>


            {/* ── Expanded section ── */}
            {expanded && (
                <div className="card-line-expanded">
                    <div className="expanded-left">
                        <StarRating rating={avg} />
                        <p className="detail-description">{course.description}</p>
                        <div className="detail-tags">
                            {course.tags.map((tag, i) => (
                                <span key={i} className="tag-pill">#{tag}</span>
                            ))}
                        </div>
                    </div>
                    <div className="expanded-right">
                        <div className="detail-lessons">
                            {typeView !== "Tips" && <h4>{typeView === "Courses" ? "Lessons" : "Exercices"}</h4>}
                            {typeView !== "Tips" && <ul>
                                {content.map((lesson, i) => (
                                    <li key={i}>
                                        <span className="lesson-number">{i + 1}</span>
                                        {lesson.title}
                                    </li>
                                ))}
                            </ul>}
                        </div>
                        {(userRole === "teacher") ? (
                            typeView === "Courses" ? <Link className="enroll-btn" to={`/courses/${course._id}?type=course`}>Go to Course</Link> : <Link className="enroll-btn" to={`/courses/${course._id}?type=assignment`}>Go To Assignment</Link>
                        ) : (
                            typeView === "Courses" ? <button className="enroll-btn">Enroll Now</button> : <button className="enroll-btn">Solve Now</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Courses() {
    const categories = ["Courses", "Assignments", "Tips", "Collections"]
    const [currentCategory, setCurrentCategory] = useState("Courses")
    const [categoryIndex, setCategoryIndex] = React.useState(0)
    const [viewClicked, setViewClicked] = useState(false)
    const [viewMode, setViewMode] = useState("line")

    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/content/courses/teacher-courses')
            .then(res => setCourses(res.data));

        axios.get('http://localhost:8080/content/assignments/teacher-assigns')
            .then(res => setAssignments(res.data));
    }, []);

    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAssignments = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='courses-container' onClick={() => viewClicked && setViewClicked(false)}>
            <div className="courses-wrapper">
                <div className="courses-page-header">
                    <div className="header-right">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder='Search by title...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <SearchIcon />
                        </div>
                        <div className="header-box filter-dropdown">
                            <span>All Categories</span>
                            <ArrowDown />
                        </div>
                        <div className="header-box filter-dropdown" onClick={(e) => { e.stopPropagation(); setViewClicked(true) }}>
                            <span>View Mode</span>
                            <GridIcon />
                            {viewClicked && (
                                <div className="drop-down-box">
                                    <ul>
                                        <li onClick={(e) => { e.stopPropagation(); setViewMode("grid"); setViewClicked(false); }}>
                                            Grid Mode <GridIcon />
                                        </li>
                                        <li onClick={(e) => { e.stopPropagation(); setViewMode("line"); setViewClicked(false); }}>
                                            Row Mode <LineIcon />
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-left categories-bar">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className={`category-card ${index === categoryIndex ? 'active' : ''}`}
                                onClick={() => { setCategoryIndex(index); setCurrentCategory(category) }}
                            >
                                {category}
                            </div>
                        ))}
                    </div>
                </div>

                {currentCategory === "Courses" && <ViewCourses viewMode={viewMode} courses={filteredCourses} />}
                {currentCategory === "Assignments" && <ViewAssignments viewMode={viewMode} assignments={filteredAssignments} />}

            </div>
        </div>
    )
}

const ViewCourses = ({ viewMode, courses }) => {

    const [selectedCourse, setSelectedCourse] = useState(null)

    const handleCardClick = (course) => {
        setSelectedCourse((prev) => (prev?._id === course._id ? null : course))
    }

    return (
        <>
            {viewMode === "grid" ? (
                <div className={`courses-grid-wrapper ${selectedCourse ? 'has-panel' : ''}`}>
                    <div className="courses-grid-container">
                        {courses.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onClick={handleCardClick}
                                isSelected={selectedCourse?._id === course._id}
                                typeView={"Courses"}
                            />
                        ))}
                    </div>
                    {selectedCourse && (
                        <CourseDetailPanel
                            course={selectedCourse}
                            onClose={() => setSelectedCourse(null)}
                            typeView={"Courses"}
                        />
                    )}
                </div>
            ) : (
                <div className="courses-row-container">
                    {courses.map((course) => (
                        <CourseCardLine key={course._id} course={course} typeView={"Courses"} />
                    ))}
                </div>
            )}
        </>
    )
}

const ViewAssignments = ({ viewMode, assignments }) => {
    const [selectedCourse, setSelectedCourse] = useState(null)

    const handleCardClick = (course) => {
        setSelectedCourse((prev) => (prev?._id === course._id ? null : course))
    }

    return (
        <>
            {viewMode === "grid" ? (
                <div className={`courses-grid-wrapper ${selectedCourse ? 'has-panel' : ''}`}>
                    <div className="courses-grid-container">
                        {assignments.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onClick={handleCardClick}
                                isSelected={selectedCourse?._id === course._id}
                                typeView={"Assignments"}
                            />
                        ))}
                    </div>
                    {selectedCourse && (
                        <CourseDetailPanel
                            course={selectedCourse}
                            onClose={() => setSelectedCourse(null)}
                            typeView={"Assignments"}
                        />
                    )}
                </div>
            ) : (
                <div className="courses-row-container">
                    {assignments.map((course) => (
                        <CourseCardLine key={course._id} course={course} typeView={"Assignments"} />
                    ))}
                </div>
            )}
        </>
    )
}

export default Courses