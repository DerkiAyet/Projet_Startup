import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg';
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
import { ReactComponent as SharIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg';
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { AppContext } from '../../../App';


function HeaderContent({ contentId, title, creatorName, creatorUserName, creationDate, commentCount, saveCount, ratingAvg, onHide, onSendWarning, onReport}) {

    const { userAuth } = useContext(AppContext)
    const [openMenu, setOpenMenu] = useState(false)
    const navigate = useNavigate()

    return (
        <div className="cd-header">
            <div className="link-line">
                {
                    userAuth.role === "student" ? (
                        <Link to="/activities">My Activities</Link>
                    ) : (
                        <Link to="/courses">Courses</Link>
                    )
                } &gt; <span>{title}</span>
            </div>
            <h1>
                {title}
            </h1>
            <div className="course-features">
                <div className="cd-header-left">
                    <div className="feature-line">
                        <AuthorIcon className='cd-icon-header' />
                        {creatorName}
                    </div>
                    <div className="feature-line">
                        <CalendarIcon className='cd-icon-header' />
                        {creationDate}
                    </div>
                    <div className="feature-line">
                        <CommentIcon className='cd-icon-header' />
                        {commentCount} comments
                    </div>
                    <div className="feature-line">
                        <SaveIcon className='cd-icon-header' />
                        {saveCount} saves
                    </div>
                    <div className="feature-line rating-stars">
                        {ratingAvg} stars
                    </div>
                </div>
                <div className="options-header-right">
                    <div className="option-box" style={{cursor: "pointer"}}>
                        <SaveIcon className="option-cd-icon" />
                    </div>
                    <div style={{ marginLeft: "auto", position: "relative" }}>
                        <div className="option-box" style={{cursor: "pointer"}}>
                            <MenuIcon
                                className="option-cd-icon"
                                onClick={() => setOpenMenu((prev) => !prev)}
                            />
                        </div>
                        {
                            openMenu && 
                            <div className="admin-dropdown">
                                <button
                                    onClick={() => {
                                        setOpenMenu(false);
                                        navigate(`/users/${creatorUserName}/profile`)
                                    }}
                                >
                                    About teacher
                                </button>
                                <button
                                    onClick={() => {
                                        onReport?.();
                                        setOpenMenu(false);
                                    }}
                                    style={{
                                        color: "rgb(237, 73, 86)"
                                    }}
                                >
                                    Report
                                </button>
                                {
                                    userAuth.role === "admin" && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onHide?.();
                                                    setOpenMenu(false);
                                                }}
                                            >
                                                Hide
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onSendWarning?.();
                                                    setOpenMenu(false);
                                                }}
                                                style={{
                                                    color: "rgb(237, 73, 86)"
                                                }}
                                            >
                                                Send warning
                                            </button></>
                                    )
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeaderContent
