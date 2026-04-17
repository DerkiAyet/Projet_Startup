import React, { useContext } from 'react';
import { AppContext } from '../../../App';
import { useNavigate } from 'react-router-dom';

const TopViewerBar = ({
    currentIndex,
    lessonsCount,
    title,
    isDone,
    contentType,
    goTo,
    toggleDone,
    hasQuiz,
    contentId
}) => {

    const { userAuth } = useContext(AppContext);

    const realLessonsCount = hasQuiz ? lessonsCount - 1 : lessonsCount;
    const isQuizPage = hasQuiz && currentIndex === realLessonsCount;

    const navigate = useNavigate();

    return (
        <div className="cd-nav-bar">

            {/* ---------- TITLE & LESSON INDICATOR ---------- */}
            <span className="cd-lesson-indicator">
                {!isQuizPage ? (
                    <>
                        Lesson {currentIndex + 1}
                        <span className="cd-lesson-sep">/</span>
                        {realLessonsCount}
                        <span className="cd-lesson-name">{title}</span>
                    </>
                ) : (
                    <>Quiz <span className="cd-lesson-name">{title}</span></>
                )}
            </span>

            <div className="cd-nav-actions">

                {/* ---------- DONE BUTTON (hidden on quiz) ---------- */}
                {userAuth.role === "student" &&
                    contentType === "course" &&
                    !isQuizPage && ( /* Hide on quiz */
                        <button
                            className={`cd-done-btn ${isDone ? "cd-done-btn--active" : ""}`}
                            onClick={toggleDone}
                        >
                            {isDone ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Done!
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    Done?
                                </>
                            )}
                        </button>
                    )
                }

                {
                    userAuth.role === "student" &&
                    contentType === "assignment" && (
                        <button
                            className="cd-done-btn"
                            onClick={() => navigate(`/activities/solve-assignment/${contentId}`)}
                        >
                            Go & Solve!
                        </button>
                    )
                }

                <button
                    className="cd-nav-btn"
                    disabled={currentIndex === 0}
                    onClick={() => goTo(currentIndex - 1)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Prev
                </button>

                <button
                    className="cd-nav-btn cd-nav-btn--next"
                    disabled={currentIndex === lessonsCount - 1}
                    onClick={() => goTo(currentIndex + 1)}
                >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

            </div>
        </div>
    );
};

export default TopViewerBar;