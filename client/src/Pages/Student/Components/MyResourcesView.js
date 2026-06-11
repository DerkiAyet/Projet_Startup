import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Teacher/Styles/OnlineCoursesDisplay.css'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/CourseIcons/comment-course.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import axios from 'axios'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'


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

function MyResourceView({ resources, loading, handleCardClick }) {
    return (
        <div className="courses-container" onClick={() => { }}>
            <div className="courses-wrapper">
                {loading && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Fetching your ressources...</span>
                    </div>
                )}
                {!loading && (
                    <div className="courses-grid-container">
                        {resources.map(resource => (
                            <ResourceCard
                                key={resource._id}
                                resource={resource}
                                openResource={(resource) => handleCardClick?.(resource)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyResourceView