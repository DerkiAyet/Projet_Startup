import React from 'react'
import '../Styles/CoursesDisplay.css'
import { ReactComponent as ChartIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg'
import { ReactComponent as QuestionIcon } from '../../../Assets/icons/CourseIcons/question.svg'
import { ReactComponent as DateIcon } from '../../../Assets/icons/Calendar/date.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'

import quizImg from '../../../Assets/images/quiz.png'

const QuizActivityCard = ({ quiz, startedAt, attempt, handleClick }) => {
    const dateOnly = startedAt
        ? new Date(startedAt).toLocaleDateString()
        : null;
    return (
        <div
            className="course-card quiz-card"
            onClick={() => handleClick?.(attempt, quiz)}
        >
            <div className="course-img-box">
                <img src={quizImg} alt={quiz.title} />
                <div className="level-box" style={{backgroundColor: "#fff"}}>
                    <ChartIcon />
                    {quiz.difficulty}
                </div>
                <MenuIcon className="menu-card-icon" />
            </div>
            <div className="course-infos-box">
                <span className='course-cat' style={{ color: `#${quiz.category.color}` }} >{quiz.category.name} {quiz.subCategory ? ` - ${quiz.subCategory.name}` : ''} </span>
                <span className="course-cat">By: {quiz.teacher.givenName} {quiz.teacher.familyName}</span>
                <h3>{quiz.title}</h3>
                <div className="course-features">
                    <div className="flex-left">
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <PeopleIcon /> {quiz.solveCount}+
                        </div>
                        <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <DateIcon className="quiz-icon" /> started {dateOnly}
                        </div>
                    </div>
                    <div className="flex-line" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <QuestionIcon /> {quiz.questions.length}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuizActivityCard
