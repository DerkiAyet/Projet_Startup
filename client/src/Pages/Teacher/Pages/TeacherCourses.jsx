import React, { useState, useEffect } from 'react'
import '../Styles/Courses.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as ArrowDown } from '../../../Assets/icons/CourseIcons/arrow-down.svg'
import { ReactComponent as GridIcon } from '../../../Assets/icons/CourseIcons/grid-mode.svg'
import { ReactComponent as LineIcon } from '../../../Assets/icons/CourseIcons/line-mode.svg'
import defaultPicture from '../../../Assets/images/default_picture.jpeg'
import { ViewCourses } from './MyCourses'
import { ViewAssignments } from './MyCourses'
import axios from 'axios'
import { useParams } from 'react-router-dom'

function TeacherCourses() {
    const { userName } = useParams()

    const categories = ["Courses", "Assignments", "Tips", "Collections"]
    const [currentCategory, setCurrentCategory] = useState("Courses")
    const [categoryIndex, setCategoryIndex] = React.useState(0)
    const [viewClicked, setViewClicked] = useState(false)
    const [viewMode, setViewMode] = useState("grid")

    const [teacher, setTeacher] = useState({})
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const userRes = await axios(`${process.env.REACT_APP_API_URL_GATEWAY}/users/users/${userName}`)
                setTeacher(userRes.data)

                const coursesRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/teacher-courses/${userName}`)
                setCourses(coursesRes.data);

                const assignsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/teacher-assigns/${userName}`)
                setAssignments(assignsRes.data);
            } catch (error) {
                console.error("Error while fetching:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

    }, [userName]);

    const [searchQuery, setSearchQuery] = useState("");

    const filteredCourses = courses.filter(course =>
        course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAssignments = assignments.filter(a =>
        a?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='courses-container' onClick={() => viewClicked && setViewClicked(false)}>
            <div className="courses-wrapper">
                <div className="courses-page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '0 0 8px' }}>
                        <img
                            src={teacher.userImg
                                ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${teacher.userImg}`
                                : defaultPicture}
                            alt={teacher.userName}
                            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EC4899' }}
                        />
                        <div>
                            <h1 style={{
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                letterSpacing: "-0.02em",
                                margin: 0,
                                color: "#1A1A1A",
                                fontFamily: "DM Sans, Segoe UI, sans-serif"
                            }}>
                                <span style={{ color: "#EC4899" }}>Dr. {teacher.familyName}</span> Courses
                            </h1>
                            <span style={{ fontSize: 13, color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
                                {courses.length} courses · {assignments.length} assignments
                            </span>
                        </div>
                    </div>
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

                {loading && (
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

export default TeacherCourses