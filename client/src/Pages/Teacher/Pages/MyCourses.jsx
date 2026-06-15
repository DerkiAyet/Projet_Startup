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
import { ReactComponent as ToolsIcon } from '../../../Assets/icons/NavIcons/tools.svg'
import { ReactComponent as CreateCourseIcon } from '../../../Assets/icons/NavIcons/create-course.svg';
import { ReactComponent as CreateExerciseIcon } from '../../../Assets/icons/NavIcons/create-exercice.svg';
import { ReactComponent as CreateTipIcon } from '../../../Assets/icons/NavIcons/create-tip.svg';
import { AppContext } from '../../../App'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'

axios.defaults.withCredentials = true;

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
export const CourseDetailPanel = ({ course, onClose, typeView }) => {

    const { userAuth } = useContext(AppContext)
    const userRole = userAuth.role

    if (!course) return null
    const avg = averageRating(course.avgRating)

    const content = typeView === "Courses" ? course.lessons : course.exercises

    return (
        <div className="course-detail-panel">
            <button className="detail-panel-close" onClick={onClose}>✕</button>
            <div className="detail-panel-img">
                <img src={fixMediaUrl(course.thumbnail)} alt={course.title} />
                <div className="detail-panel-level">
                    <ChartIcon /> {course.level}
                </div>
            </div>
            <div className="detail-panel-body">
                <span className="course-cat" style={{ color: `#${course.category.color}` }}> {course.category.name} {course.subCategory ? ` - ${course.subCategory.name}` : ''} </span>
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
                <img src={fixMediaUrl(course.thumbnail)} alt={course.title} />
                {
                    typeView !== "Tips" &&
                    <div className="level-box">
                        <ChartIcon />
                        {course.level}
                    </div>}
                <MenuIcon className="menu-card-icon" />
            </div>
            <div className="course-infos-box">
                <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category.name} {course.subCategory ? ` - ${course.subCategory.name}` : ''} </span>
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
export const CourseCardLine = ({ course, typeView }) => {
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
                    <img src={fixMediaUrl(course.thumbnail)} alt={course.title} />
                </div>
                <div className="course-infos-box">
                    <div className="top-wrapper">
                        <h3>{course.title}</h3>
                        <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category.name} {course.subCategory ? ` - ${course.subCategory.name}` : ''} </span>
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
    const [viewMode, setViewMode] = useState("grid")

    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const coursesRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/teacher-courses`)
                setCourses(coursesRes.data);

                const assignsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/teacher-assigns`)
                setAssignments(assignsRes.data);
            } catch (error) {
                console.error("Error while fetching:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

    }, []);

    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = courses.filter(course =>
        course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAssignments = assignments.filter(a =>
        a?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [toolsClicked, setToolsClicked] = useState(false)

    const navigate = useNavigate()
 
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
                        <div className="header-box filter-dropdown cat-filter">
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
                        <div className="header-box tools-box cat-filter" onClick={(e) => { e.stopPropagation(); setToolsClicked((prev) => !prev) }}>
                            <span>Tools</span>
                            <ToolsIcon />
                            {toolsClicked && (
                                <div className="drop-down-box">
                                    <ul>
                                        <li onClick={(e) => { e.stopPropagation(); navigate('/create-course'); setToolsClicked(false) }}>
                                            Create Course <CreateCourseIcon />
                                        </li>
                                        <li onClick={(e) => { e.stopPropagation(); navigate('/create-assignment'); setToolsClicked(false) }}>
                                            Create Assignment <CreateExerciseIcon />
                                        </li>
                                        <li onClick={(e) => { e.stopPropagation(); navigate('/create-tip'); setToolsClicked(false) }}>
                                            Create Tip <CreateTipIcon />
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

                { loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Fetching Data…</span>
                    </div>
                )}

                {currentCategory === "Courses" && <ViewCourses viewMode={viewMode} courses={filteredCourses} />}
                {currentCategory === "Assignments" && <ViewAssignments viewMode={viewMode} assignments={filteredAssignments} />}

            </div>
        </div>
    )
}

export const ViewCourses = ({ viewMode, courses }) => {

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

export const ViewAssignments = ({ viewMode, assignments }) => {
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