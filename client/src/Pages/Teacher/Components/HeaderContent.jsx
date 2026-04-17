import React, { useContext } from 'react'
import { Link } from 'react-router-dom';
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg';
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
import { ReactComponent as SharIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg';
import { AppContext } from '../../../App';


function HeaderContent({ title, creatorName, creationDate, commentCount, saveCount, ratingAvg,  }) {

    const {userAuth} = useContext(AppContext)

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
                        { creationDate }
                    </div>
                    <div className="feature-line">
                        <CommentIcon className='cd-icon-header' />
                        {commentCount} comments
                    </div>
                    <div className="feature-line">
                        <SaveIcon className='cd-icon-header' />
                        { saveCount } saves
                    </div>
                    <div className="feature-line rating-stars">
                        { ratingAvg } stars
                    </div>
                </div>
                <div className="options-header-right">
                    <div className="option-box">
                        <SaveIcon className="option-cd-icon" />
                    </div>
                    <div className="option-box">
                        <SharIcon className="option-cd-icon" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeaderContent
