import { useState, useEffect, useContext } from "react";
import ContentViewer from "./ContentViewer";
import TopViewerBar from "./TopViewerBar";
import axios from 'axios'
import { AppContext } from "../../../App";

export function CourseView({ LESSONS, viewerRef, handleChangePct, courseId, onChangeDone, initializeDone, onChangeLesson, quiz, handleShowQuiz, openQuizViewer }) {

    const { userAuth } = useContext(AppContext)
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [enrollement, setEnrollement] = useState({})
    const [doneLessons, setDoneLessons] = useState(new Set());

    useEffect(() => {
        if (userAuth.role === "student") {
            axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/enrollements/${courseId}`)
                .then((res) => {
                    setEnrollement(res.data)
                    setDoneLessons(new Set(res.data.lessonsCompleted))
                    initializeDone(new Set(res.data.lessonsCompleted))
                    handleChangePct(new Set(res.data.lessonsCompleted).size)
                })
        }
    }, [courseId])

    // code added for quiz
    const hasQuiz = !!quiz;
    const totalSteps = LESSONS.length + (hasQuiz ? 1 : 0);
    const isQuizPage = hasQuiz && currentLessonIdx === LESSONS.length;

    const lesson = !isQuizPage ? LESSONS[currentLessonIdx] : null;
    const isDone = doneLessons.has(lesson?._id);

    const goTo = (idx) => {
        if (idx < 0 || idx >= totalSteps) return;

        setCurrentLessonIdx(idx);
        onChangeLesson?.(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleDone = () => {
        axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/enrollements/${enrollement._id}/lesson-completed/${lesson._id}`, {}, {
            headers: { "Content-Type": "application/json" }
        })
            .then((res) => {
                // Build the Set from the server's source of truth
                const updatedSet = new Set(res.data.lessonsCompleted);
                setDoneLessons(updatedSet);
                handleChangePct(updatedSet.size);
                onChangeDone?.(updatedSet);
            })
            .catch((err) => console.error(err.response.data))
    };

    const allDone = doneLessons.size === LESSONS.length;

    if (!LESSONS || LESSONS.length === 0) return null;

    return (
        <>
            <TopViewerBar
                currentIndex={currentLessonIdx}
                lessonsCount={totalSteps}
                title={isQuizPage ? quiz.title : lesson.title}
                contentType={"course"}
                goTo={goTo}
                isDone={isQuizPage ? false : isDone}
                toggleDone={isQuizPage ? null : toggleDone}
                hasQuiz={hasQuiz}
                contentId={courseId}
            />

            {!isQuizPage ? (
                <ContentViewer
                    content={lesson.content}
                    exerciseType={"text"}
                    title={lesson.title}
                    lessonType={lesson.lessonType}
                    videoUrl={lesson.videoUrl}
                />
            ) : (
                <div className="cd-page-card cd-quiz-page">
                    <div className="cd-page-number">Final Step</div>

                    <div className="cd-page-content cd-quiz-content">
                        <h2>{quiz.title}</h2>
                        {
                            userAuth.role === "student" ?
                                (<div className="cd-quiz-body">
                                    {
                                        allDone ? (
                                            <>
                                                <p>You’ve completed all lessons 🎉</p>
                                                <span>Ready to test your knowledge?</span>
                                            </>
                                        ) : (
                                            <>
                                                <p>Almost there! 🚀</p>
                                                <span>Complete all lessons to unlock the final quiz.</span>
                                            </>
                                        )
                                    }

                                    <button
                                        className="cd-start-quiz-btn"
                                        onClick={() => handleShowQuiz(quiz)}
                                        disabled={!allDone}
                                    >
                                        {allDone ? "Start Quiz" : "Complete all lessons to unlock the quiz"}
                                    </button>
                                </div>) : (
                                    <div className="cd-quiz-body">

                                        <p>A quiz is available! </p>

                                        <button
                                            className="cd-start-quiz-btn"
                                            onClick={() => openQuizViewer()}
                                        >
                                            See Quiz
                                        </button>
                                    </div>
                                )
                        }
                    </div>

                    <div className="cd-page-footer">
                        <span>{quiz.title}</span>
                        <span>{currentLessonIdx + 1} / {totalSteps}</span>
                    </div>
                </div>
            )}

            <div className="cd-viewer-nav">
                {currentLessonIdx > 0 && (
                    <button className="cd-viewer-nav-btn" onClick={() => goTo(currentLessonIdx - 1)}>
                        ← {currentLessonIdx - 1 < LESSONS.length
                            ? LESSONS[currentLessonIdx - 1].title
                            : quiz.title}
                    </button>
                )}

                {currentLessonIdx < totalSteps - 1 && (
                    <button className="cd-viewer-nav-btn" onClick={() => goTo(currentLessonIdx + 1)}>
                        {currentLessonIdx + 1 < LESSONS.length
                            ? LESSONS[currentLessonIdx + 1].title
                            : quiz.title} →
                    </button>
                )}
            </div>
        </>
    );
}