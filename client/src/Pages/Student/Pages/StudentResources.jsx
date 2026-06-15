import React, { useState, useEffect } from 'react'
import '../Styles/Search.css'
import '../Styles/MyResources.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as ArrowDown } from '../../../Assets/icons/CourseIcons/arrow-down.svg'
import defaultPicture from '../../../Assets/images/default_picture.jpeg'
import axios from 'axios'
import RessourcePage from '../Components/RessourcePage'
import MyResourceView from '../Components/MyResourcesView'
import { useParams } from 'react-router-dom'

function StudentResources() {
    const { userName } = useParams()

    const [student, setStudent] = useState({})
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        axios.defaults.withCredentials = true
        const fetchData = async () => {
            try {
                setLoading(true)

                const userRes = await axios(`${process.env.REACT_APP_API_URL_GATEWAY}/users/users/${userName}`)
                setStudent(userRes.data)

                const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/student-resources/${userName}`)
                setResources(res.data);
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData();
    }, [userName])

    const [searchQuery, setSearchQuery] = useState("");

    const filteredResources = resources.filter(resource =>
        resource?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [resourceOpenPage, setResourcePageOpen] = useState({
        visible: false,
        resource: null
    })

    const handleOpenResource = async (resource) => {
        setResourcePageOpen({ visible: true, resource: resource })
    }

    return (
        <div className="search-page">
            <div className="header-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '0 0 8px' }}>
                    <img
                        src={student.userImg
                            ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${student.userImg}`
                            : defaultPicture}
                        alt={student.userName}
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
                            <span style={{ color: "#EC4899" }}>{student.givenName}'s</span> Shared Resources
                        </h1>
                        <span style={{ fontSize: 13, color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
                            {resources.length} resources
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
                </div>
            </div>
            <div className="search-results-area">
                <MyResourceView
                    resources={filteredResources}
                    handleCardClick={handleOpenResource}
                />
            </div>
            {
                resourceOpenPage.visible &&
                <RessourcePage
                    visible={resourceOpenPage.visible}
                    selectedResource={resourceOpenPage.resource}
                    onClose={() => setResourcePageOpen({ visible: false, resource: null })}
                />
            }
        </div>
    )
}

export default StudentResources