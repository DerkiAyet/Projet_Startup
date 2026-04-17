import { ReactComponent as ChartIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as TimeIcon } from '../../../Assets/icons/CourseIcons/time.svg'
import { ReactComponent as VisibleIcon } from '../../../Assets/icons/CourseIcons/visible.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/CourseIcons/delete.svg'
import { useNavigate } from 'react-router-dom';


export const CourseActivityCard = ({ course, typeView, enrolledAt}) => {
    const content = course.lessons
    const completedLessons = course.completedLessons || 0
    const totalLessons = content?.length || 0
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const navigate = useNavigate();

    const dateOnly = enrolledAt
        ? new Date(enrolledAt).toLocaleDateString()
        : null;

    return (
        <div className="course-card-line">
            <div className="line-flex">
                <div className="card-row-left">
                    <div className="course-img-row-box">
                        <img src={course.thumbnail} alt={course.title} />
                    </div>
                    <div className="course-infos-box">
                        <div className="top-wrapper">
                            <h3>{course.title}</h3>
                            <span className='course-cat' style={{ color: `#${course.category.color}` }}>{course.category.name} {course.subCategory ? ` - ${course.subCategory.name}` : ''} </span>
                            <h5 className='course-cat'> Instructor: {course.teacher.givenName} {course.teacher.familyName} </h5>
                        </div>
                        <div className="course-features">
                            <div className="flex-left">
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <ChartIcon /> {course.level}
                                </div>
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <LessonIcon /> {`${content.length} Lessons`}
                                </div>
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <TimeIcon /> Enrolled at {dateOnly}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-row-right">
                    <div className="action-box">
                        <VisibleIcon />
                    </div>
                    <div className="action-box">
                        <DeleteIcon />
                    </div>
                </div>
            </div>
            <div className="seperator" />
            <div className="progress-wrapper">
                <div className="course-progress-section">
                    <div className="course-progress-header">
                        <span className="course-progress-label">Your Progress</span>
                        <span className="course-progress-percentage">{progressPercentage}%</span>
                    </div>
                    <div className="course-progress-bar">
                        <div
                            className="course-progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="course-progress-stats">
                        <span className="completed-lessons">{completedLessons} / {totalLessons} lessons completed</span>
                    </div>
                </div>
                <button className='go-to-course' onClick={() => navigate(`/courses/${course._id}?type=course`)}>
                    { progressPercentage === 100 ? "Review" : "Continue" }
                </button>
            </div>
        </div>
    )
}