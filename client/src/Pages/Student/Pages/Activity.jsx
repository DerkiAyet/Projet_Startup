import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../../App";
import "../Styles/Activity.css";
import { ReactComponent as CourseIcon } from '../../../Assets/icons/NavIcons/courses.svg';
import { ReactComponent as AssignmentIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg';
import { ReactComponent as QuizIcon } from '../../../Assets/icons/NavIcons/create-exercice.svg';
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as ArrowDown } from '../../../Assets/icons/CourseIcons/arrow-down.svg'
import { CourseActivityCard } from "../Components/CourseActivityCard";
import axios from "axios";
import QuizActivityCard from "../Components/QuizActivityCard";
import QuizSolve from "../Components/QuizSolve";
import { AssignmentActivityCard } from "../Components/AssignmentActivityCard";


const StatsCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="stats-card">
        <div className="stats-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon />
        </div>
        <div className="stats-info">
            <div className="stats-value">{value}</div>
            <div className="stats-title">{title}</div>
            {subtitle && <div className="stats-subtitle">{subtitle}</div>}
        </div>
    </div>
);

export default function StudentActivity() {
    const { userAuth } = useContext(AppContext);
    const [loading, setLoading] = useState(false);

    const categories = ["Courses", "Quizes", "Assignments"]
    const [currentCategory, setCurrentCategory] = useState("Courses")
    const [categoryIndex, setCategoryIndex] = React.useState(0)
    const [searchQuery, setSearchQuery] = useState("");

    const [courseEnrolls, setCourseEnrolls] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([])
    const [assignsSolved, setAssignsSolved] = useState([])

    useEffect(() => {

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/courses-enrolled`)
            .then((response) => {
                setCourseEnrolls(response.data);
            })
            .catch((error) => {
                console.error("Error fetching course enrollments:", error);
            });

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/me/quizes`)
            .then((res) => setQuizAttempts(res.data))
            .catch((err) => {
                console.error("Error fetching solved quizes:", err);
            })

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/student-solutions`)
            .then((res) => {setAssignsSolved(res.data); console.log(res.data)})
            .catch((err) => {
                console.error("Error fetching solved quizes:", err);
            })

    }, [])

    const [attemptId, setAttemptId] = useState(null)
    const [quizData, setQuizData] = useState({})
    const [savedAnswers, setSavedAnswers] = useState({})
    const [showQuizSolve, setShowQuizSolve] = useState(false)
    const [completedResult, setCompletedResult] = useState(null) // to hold the result of a completed quiz for display in QuizSolve


    const handleSaveQuiz = async (answers) => {
        await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/quiz-attempts/${attemptId}/save`, { answers: answers }, {
            headers: { 'Content-Type': 'application/json' }
        })
        setShowQuizSolve(false)
    }

    const handleOpenQuiz = (attempt, quiz) => {

        const savedAnswers = {};

        attempt.answers.forEach(a => {
            savedAnswers[a.questionId] = a.responses;
        });

        if (attempt.completedAt) setCompletedResult(attempt)

        setAttemptId(attempt._id)
        setQuizData(quiz)
        setSavedAnswers(savedAnswers)
        setShowQuizSolve(true)
        console.log(attempt)
    }

    const handleSubmitQuiz = async (answers) => {
        const response = await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/quiz-attempts/${attemptId}/submit`, { answers: answers }, {
            headers: { 'Content-Type': 'application/json' }
        })

        return response.data; // return the result to QuizSolve for display
    }

    if (loading) {
        return (
            <div className="activity-loading">
                <div className="loading-spinner" />
                <span>Loading your activity...</span>
            </div>
        );
    }

    return (
        <div className="student-activity-container">
            {/* Stats Grid */}
            <div className="stats-grid">
                <StatsCard
                    icon={CourseIcon}
                    title="Courses Enrolled"
                    value={courseEnrolls.length}
                    subtitle="Active courses"
                    color="#EC4899"
                />
                <StatsCard
                    icon={AssignmentIcon}
                    title="Solutions sent"
                    value={assignsSolved?.length}
                    subtitle={`Avg: ${85}%`}
                    color="#F59E0B"
                />
                <StatsCard
                    icon={QuizIcon}
                    title="Quizzes Completed"
                    value={quizAttempts.filter(attempt => attempt.attempt.completedAt).length}
                    subtitle="Total attempts"
                    color="#10B981"
                />
            </div>

            <div className="activity-bottom-container">
                <div className="activity-page-header">
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
                        <div className="header-box filter-dropdown">
                            <span>All Categories</span>
                            <ArrowDown />
                        </div>
                    </div>
                </div>

                {currentCategory === "Courses" && <EnrollementsView enrolls={courseEnrolls} />}
                {currentCategory === "Quizes" && <QuizesView quizAttempts={quizAttempts} handleOpenQuiz={handleOpenQuiz} />}
                {currentCategory === "Assignments" && <SolutionsView solutions={assignsSolved} />}
            </div>

            {
                showQuizSolve &&
                <QuizSolve
                    quiz={quizData}
                    attemptId={attemptId}
                    initialAnswers={savedAnswers || {}}
                    onClose={() => setShowQuizSolve(false)}
                    onSave={handleSaveQuiz}
                    onSubmit={handleSubmitQuiz}
                    completedResult={completedResult}
                />
            }
        </div>
    );
}

const EnrollementsView = ({ enrolls }) => {
    return (
        <div className="courses-row-container">
            {enrolls.map((enroll, index) => (
                <CourseActivityCard
                    course={{
                        ...enroll.course,
                        completedLessons: enroll.lessonsCompleted?.length || 0,
                        totalLessons: enroll.course.lessons.length,
                    }}
                    typeView="Courses"
                    enrolledAt={enroll.enrolledAt}
                />
            ))}
        </div>
    )
}

const QuizesView = ({ quizAttempts, handleOpenQuiz }) => {
    return (
        <div className="courses-grid-container">
            {quizAttempts.map((qAttempt, index) => (
                <QuizActivityCard
                    quiz={qAttempt.quiz}
                    startedAt={qAttempt.attempt.startedAt}
                    attempt={qAttempt.attempt}
                    handleClick={handleOpenQuiz}
                />
            ))}
        </div>
    )
}

const SolutionsView = ({solutions}) => {
    return (
        <div className="courses-row-container">
            {
                solutions.map((s) => (
                    <AssignmentActivityCard solution={s} />
                ))
            }
        </div>
    )
}