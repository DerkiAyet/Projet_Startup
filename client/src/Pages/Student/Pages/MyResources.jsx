import React, { useState, useRef, useEffect, useContext } from 'react'
import '../Styles/Search.css'
import '../Styles/MyResources.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as ArrowDown } from '../../../Assets/icons/CourseIcons/arrow-down.svg'
import axios from 'axios'
import RessourcePage from '../Components/RessourcePage'
import MyResourceView from '../Components/MyResourcesView'

function MyResources() {

    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        axios.defaults.withCredentials = true
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/me`)
                setResources(res.data);
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData();
    }, [])

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
                <div className="sub-header-top" style={{display: "flex", flexDirection: "column"}}>
                        <h1 className="mr-title">My Resources</h1>
                        <p className="mr-subtitle">Access and manage your learning materials and shared resources</p>
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
                    resources={resources}
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

export default MyResources