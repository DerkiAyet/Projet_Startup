import { ReactComponent as ChartIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import { ReactComponent as TimeIcon } from '../../../Assets/icons/CourseIcons/time.svg'
import { ReactComponent as VisibleIcon } from '../../../Assets/icons/CourseIcons/visible.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/CourseIcons/delete.svg'
import { useNavigate } from 'react-router-dom';
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'

export const AssignmentActivityCard = ({ solution }) => {
    const assignment = solution.assignment
    const totalExercises = solution.totalExercises || 0
    const problemsSolved = Array.isArray(solution.problemsSolved)
        ? solution.problemsSolved.length
        : solution.problemsSolved || 0
    const navigate = useNavigate();

    const dateOnly = solution.solvedAt
        ? new Date(solution.solvedAt).toLocaleDateString()
        : null;

    const getStatus = () => {
        if (solution.status === 'graded') {
            return { label: "Graded", color: '#10B981', bg: '#10B98115' }
        } else if (solution.posted) {
            return { label: "On hold", color: '#F59E0B', bg: '#F59E0B15' }
        } else {
            return { label: "Not submitted yet", color: '#6B7280', bg: '#6B728015' }
        }
    }

    const status = getStatus()

    return (
        <div className="course-card-line">
            <div className="line-flex">
                <div className="card-row-left">
                    <div className="course-img-row-box">
                        <img src={fixMediaUrl(assignment.thumbnail)} alt={assignment.title} />
                    </div>
                    <div className="course-infos-box">
                        <div className="top-wrapper">
                            <h3>{assignment.title}</h3>
                            <span className='course-cat' style={{ color: `#${assignment.category.color}` }}>
                                {assignment.category.name} {assignment.subCategory ? ` - ${assignment.subCategory.name}` : ''}
                            </span>
                            <h5 className='course-cat'>
                                Instructor: {assignment.teacher.givenName} {assignment.teacher.familyName}
                            </h5>
                        </div>
                        <div className="course-features">
                            <div className="flex-left">
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <ChartIcon /> {assignment.level}
                                </div>
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <LessonIcon /> {`${totalExercises} Exercises`}
                                </div>
                                <div className="flex-line feature-card" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <TimeIcon /> {dateOnly}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-row-right">
                    <div className="action-box"><VisibleIcon /></div>
                    <div className="action-box"><DeleteIcon /></div>
                </div>
            </div>
            <div className="seperator" />
            <div className="progress-wrapper">
                <div className="course-progress-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                        {/* Exercises count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                width: 52, height: 52, borderRadius: '50%',
                                border: `3px solid ${status.color}`,
                                backgroundColor: status.bg,
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: status.color, lineHeight: 1 }}>
                                    {problemsSolved}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: status.color, lineHeight: 1 }}>
                                    / {totalExercises}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8E8E8E' }}>
                                    Exercises solved
                                </span>
                                {/* Status badge */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: '0.75rem', fontWeight: 500,
                                    color: status.color,
                                    backgroundColor: status.bg,
                                    padding: '2px 8px', borderRadius: 20,
                                    width: 'fit-content',
                                    marginTop: "4px"
                                }}>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        backgroundColor: status.color
                                    }} />
                                    {status.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    className='go-to-course'
                    onClick={() => navigate(`/activities/solve-assignment/${assignment._id}`)}
                >
                    {solution.status === 'graded' ? "Review" : solution.posted ? "View" : "Continue"}
                </button>
            </div>
        </div>
    )
}