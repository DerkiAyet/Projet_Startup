import React, { useContext } from 'react'
import { Link } from 'react-router-dom';
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg';
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
import { ReactComponent as SharIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg';
import { AppContext } from '../../../App';


function HeaderContent({ title, creatorName, creationDate, commentCount, saveCount, ratingAvg, handleSubmit, handleSave, status, graded }) {

    const { userAuth } = useContext(AppContext)

     const statusColor = {
        submitted: { color: "#F59E0B", bg: "#FFFBEB" },
        reviewed: { color: "#3B82F6", bg: "#EFF6FF" },
        graded: { color: "#10B981", bg: "#ECFDF5" },
    }[status] || { color: "#8E8E8E", bg: "#F1F5F9" };

    return (
        <div className="as-header">
            <div className="link-line">
                {
                    userAuth.role === "student" ? (
                        <Link to="/activities">My Activities</Link>
                    ) : (
                        <Link to="/courses">Courses</Link>
                    )
                } &gt; <span>{title}</span>
            </div>
            <h1 style={{textTransform: "capitalize"}}>
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
                    {graded && (
                        <div className="feature-line">
                            <span style={{
                                padding: "0.2rem 0.7rem", borderRadius: "20px",
                                fontSize: "0.78rem", fontWeight: 700,
                                color: statusColor.color,
                                background: statusColor.bg,
                            }}>
                                {status}
                            </span>
                        </div>
                    )}
                </div>
                { !graded ? <div className="options-header-right">
                        <button className="draft-btn" onClick={handleSave}>Save as Draft</button>
                        <button className='submit-btn' onClick={handleSubmit}>Send Solution</button>
                </div> : 
                <div className="options-header-right">
                        <span style={{color: "#EC4899", padding: "4px 8px", border: "2px solid #EC4899", borderRadius: "10px"}} >Teacher Graded your Solution!</span>
                </div> }
            </div>
        </div>
    )
}

export default HeaderContent
