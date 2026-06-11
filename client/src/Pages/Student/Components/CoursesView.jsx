import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../Styles/CoursesDisplay.css'
import { ReactComponent as ChartIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/CourseIcons/comment-course.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as GridIcon } from '../../../Assets/icons/CourseIcons/grid-mode.svg'
import { ReactComponent as LineIcon } from '../../../Assets/icons/CourseIcons/line-mode.svg'
import NotFound from '../../../Assets/images/find-course.png'
import axios from 'axios'
import { AppContext } from '../../../App'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'



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

    const avg = averageRating(course.avgRating)

    const content =
        typeView === "Courses"
            ? course?.lessons ?? []
            : typeView === "Assignments"
                ? course?.exercises ?? []
                : [];

    const navigate = useNavigate()

    const handleEnroll = (e) => {
        e.preventDefault()

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/enrollements/${course._id}`, {}, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(() => navigate(`/courses/${course._id}?type=course`))
            .catch((err) => console.error(err.response.data))
    }

    const goToSolve = (e) => {
        e.preventDefault()
        navigate(`/courses/${course._id}?type=assignment`)
    }

    if (!course) return null

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
                <span className="course-cat" style={{ color: `#${course.category.color}` }}> {course.category?.name} {course.subCategory ? ` - ${course.subCategory?.name}` : ''} </span>
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
                            <span>{typeView === "Courses" ? `${content.length} lessons` : `${course.length} exercises`}</span>
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

                {
                    typeView === "Courses" ?
                        (userAuth.role === "student" ? <button className="enroll-btn" onClick={handleEnroll}>Enroll Now</button> : <button className="enroll-btn" onClick={() => navigate(`/courses/${course._id}?type=course`)}>View Course</button>) :
                        (userAuth.role === "student" ? <button className="enroll-btn" onClick={goToSolve}>Solve Now</button> : <button className="enroll-btn" onClick={goToSolve}>View Assignment</button>)
                }

            </div>
        </div>
    )
}

// ─── Course Card (Grid) ───────────────────────────────────────────────────────
export const CourseCard = ({ course, onClick, isSelected, typeView }) => {
    const content =
        typeView === "Courses"
            ? course?.lessons ?? []
            : typeView === "Assignments"
                ? course?.exercises ?? []
                : [];
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
                <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category?.name} {course.subCategory ? ` - ${course.subCategory?.name}` : ''} </span>
                <h3>{course.title}</h3>
                <h5 className='made-by'>Instructor: {course?.teacher?.givenName} {course?.teacher?.familyName}</h5>
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
                        <LessonIcon /> {content.length > 0 ? `${content.length}` : ""}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const ResourceCard = ({ resource, openResource }) => {
    return (
        <div
            className={`course-card`}
            onClick={() => openResource?.(resource)}
        >
            <div className="course-img-box">
                <img src={fixMediaUrl(resource.thumbnail)} alt={resource.title} />
                <MenuIcon className="menu-card-icon" />
            </div>
            <div className="course-infos-box">
                <span className='course-cat' style={{ color: `#${resource.category.color}` }}>{resource.category?.name} {resource.subCategory ? ` - ${resource.subCategory?.name}` : ''} </span>
                <h3>{resource.title}</h3>
                <h5 className='made-by'>Student: {resource?.student?.givenName} {resource?.student?.familyName}</h5>
                <div className="course-features">
                    <div className="flex-left">
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <PeopleIcon /> {resource.viewCount} views
                        </div>
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <CommentIcon /> {resource.commentsCount}+
                        </div>
                    </div>
                    <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <LessonIcon /> {resource?.attachments?.length > 0 ? `${resource?.attachments?.length}` : ""}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Course Card (Line / Row) ─────────────────────────────────────────────────
export const CourseCardLine = ({ course, typeView }) => {

    const { userAuth } = useContext(AppContext)

    const [expanded, setExpanded] = useState(false)
    const avg = averageRating(course.avgRating)
    const content =
        typeView === "Courses"
            ? course?.lessons ?? []
            : typeView === "Assignments"
                ? course?.exercises ?? []
                : [];

    const navigate = useNavigate()
    const handleEnroll = (e) => {
        e.preventDefault()

        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/enrollements/${course._id}`, {}, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(() => navigate(`/courses/${course._id}?type=course`))
            .catch((err) => console.error(err.response.data))
    }

    const goToSolve = (e) => {
        e.preventDefault()
        navigate(`/courses/${course._id}?type=assignment`)
    }

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
                        <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category?.name} {course.subCategory ? ` - ${course.subCategory?.name}` : ''} </span>
                        <h5 className='made-by'>Instructor: {course?.teacher?.givenName} {course?.teacher?.familyName}</h5>
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
                                    <LessonIcon /> {typeView === "Courses" ? `${content.length} lessons` : `${content.length} Exercises`}
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
                        {
                            typeView === "Courses" ?
                                (userAuth.role === "student" ? <button className="enroll-btn" onClick={handleEnroll}>Enroll Now</button> : <button className="enroll-btn" onClick={() => navigate(`/courses/${course._id}?type=course`)}>View Course</button>) :
                                (userAuth.role === "student" ? <button className="enroll-btn" onClick={goToSolve}>Solve Now</button> : <button className="enroll-btn" onClick={goToSolve}>View Assignment</button>)
                        }
                    </div>
                </div>
            )}
        </div>
    )
}


function CoursesView({ courses, assignments, searched, loading, query, selectedCats, resources, setResourcePageOpen, setResources }) {
    const categories = ["Courses", "Assignments", "Quizes", "Tips", "Resource Library"]
    const [currentCategory, setCurrentCategory] = useState("Courses")
    const [categoryIndex, setCategoryIndex] = useState(0)
    const [viewClicked, setViewClicked] = useState(false)
    const [viewMode, setViewMode] = useState("grid")

    const handleOpenResource = async (resource) => {
        try {
            const { data } = await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resource._id}/view`, {},
                { headers: { "Content-Type": "application/json" } }
            )
            setResourcePageOpen({
                visible: true,
                resource: data.viewAdded
                    ? { ...resource, viewCount: resource.viewCount + 1 }
                    : resource
            })
            setResources((prev) =>
                prev.map((r) => r._id === resource._id ? { ...r, viewCount: r.viewCount + 1 } : r)
            )
        } catch (error) {
            console.log(error.message)
            setResourcePageOpen({ visible: true, resource })
        }
    }

    return (
        <div className='courses-container' onClick={() => viewClicked && setViewClicked(false)}>
            <div className="courses-wrapper">
                <div className="courses-page-header">
                    <div className="header-right flex-row">
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
                </div>

                {
                    !searched && (
                        <div className="recommendations-line" style={{ display: "flex", width: "100%", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #D9E1E7", paddingBottom: "0.5rem", fontFamily: "Nunito, sans serif", color: "#8A8A8A" }}>
                            Recommended for you ~
                        </div>
                    )
                }

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

                {currentCategory === "Courses" && <ViewCourses viewMode={viewMode} courses={courses} searched={searched} loading={loading} query={query} categories={selectedCats} />}
                {currentCategory === "Assignments" && <ViewAssignments viewMode={viewMode} assignments={assignments} searched={searched} loading={loading} query={query} categories={selectedCats} />}
                {currentCategory === "Resource Library" && <ViewResources resources={resources} searched={searched} loading={loading} query={query} categories={selectedCats} handleOpenResource={handleOpenResource} />}
            </div>
        </div>
    )
}

const ViewCourses = ({ viewMode, courses, searched, loading, query, categories }) => {

    const [selectedCourse, setSelectedCourse] = useState(null)

    const handleCardClick = (course) => {
        setSelectedCourse((prev) => (prev?._id === course._id ? null : course))
    }

    return (
        <>
            {
                searched && !loading && courses.length === 0 ? (
                    <div className="search-empty-state">
                        <img src={NotFound} alt="not found" style={{ width: "200px" }} />
                        <p>No courses found for <strong>"{query}"</strong>{categories.length > 0 && ` in ${categories}`}
                        </p>
                    </div>

                ) :
                    viewMode === "grid" ? (
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

const ViewAssignments = ({ viewMode, assignments, searched, loading, query, categories }) => {
    const [selectedCourse, setSelectedCourse] = useState(null)

    const handleCardClick = (course) => {
        setSelectedCourse((prev) => (prev?._id === course._id ? null : course))
    }

    return (
        <>
            {
                searched && !loading && assignments.length === 0 ? (
                    <div className="search-empty-state">
                        <img src={NotFound} alt="not found" style={{ width: "200px" }} />
                        <p>No Assignments found for <strong>"{query}"</strong>{categories.length > 0 && ` in ${categories}`}
                        </p>
                    </div>

                ) :
                    viewMode === "grid" ? (
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

const ViewResources = ({ resources, searched, loading, query, categories, handleOpenResource }) => {

    return (
        <>
            {
                searched && !loading && resources.length === 0 ? (
                    <div className="search-empty-state">
                        <img src={NotFound} alt="not found" style={{ width: "200px" }} />
                        <p>No resources found for <strong>"{query}"</strong>{categories.length > 0 && ` in ${categories}`}
                        </p>
                    </div>

                ) :
                    <div className={`courses-grid-wrapper`}>
                        <div className="courses-grid-container">
                            {resources.map((resource) => (
                                <ResourceCard
                                    key={resource._id}
                                    resource={resource}
                                    openResource={(resource) => handleOpenResource(resource)}
                                />
                            ))}
                        </div>
                    </div>
            }
        </>
    )
}

export default CoursesView
