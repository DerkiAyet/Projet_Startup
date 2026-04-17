import React, { useState, useEffect } from 'react'
import '../Styles/QuizSolve.css'

function QuizSolve({ quiz, attemptId, initialAnswers = {}, onClose, onSave, onSubmit, completedResult }) {
    // answers: { [questionId]: string[] }
    const [answers, setAnswers] = useState(initialAnswers)
    const [activeQuestion, setActiveQuestion] = useState(0)
    const [result, setResult] = useState(completedResult) // { score, maxScore, answers }
    const [submitted, setSubmitted] = useState(completedResult ? true : false)
    const [errors, setErrors] = useState({})
    const [elapsed, setElapsed] = useState(0) // seconds

    const questions = quiz?.questions || []
    const q = questions[activeQuestion]

    /* ── Timer ── */
    useEffect(() => {
        if (submitted) return
        const interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
        return () => clearInterval(interval)
    }, [submitted])

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    /* ── Answer selection ── */
    const toggleAnswer = (questionId, optionValue) => {
        setAnswers(prev => {
            const current = prev[questionId] || []
            const already = current.includes(optionValue)
            return {
                ...prev,
                [questionId]: already
                    ? current.filter(v => v !== optionValue)
                    : [...current, optionValue]
            }
        })
        setErrors(prev => ({ ...prev, [questionId]: '' }))
    }

    /* ── Progress ── */
    const answeredCount = questions.filter(q => (answers[q._id] || []).length > 0).length
    const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0

    /* ── Validate all answered ── */
    const validate = () => {
        const e = {}
        questions.forEach(q => {
            if (!answers[q._id] || answers[q._id].length === 0) {
                e[q._id] = 'Please select at least one answer.'
            }
        })
        setErrors(e)
        // jump to first unanswered
        if (Object.keys(e).length > 0) {
            const firstIdx = questions.findIndex(q => e[q._id])
            setActiveQuestion(firstIdx)
        }
        return Object.keys(e).length === 0
    }

    /*-- Save Attempt--*/

    const handleSave = async () => {
        const payload = questions.map(q => ({
            questionId: q._id,
            responses: answers[q._id] || []
        }))
        try {
            await onSave(payload)
            onClose()
        } catch (err) {
            console.error('Error saving quiz:', err)
        }
    }


    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!validate()) return

        const payload = questions.map(q => ({
            questionId: q._id,
            responses: answers[q._id] || []
        }))

        try {
            const res = await onSubmit(payload)
            setResult(res)
            setSubmitted(true)
        } catch (err) {
            console.error('Error submitting quiz:', err)
        }
    }

    const completed = completedResult?.completedAt
        ? new Date(completedResult.completedAt).toLocaleDateString()
        : null;

    /* ── Result screen ── */
    if (submitted && result) {
        const pct = Math.round((result.score / result.maxScore) * 100)
        const passed = pct >= 60

        return (
            <div className="qs-overlay" onClick={onClose}>
                <div className="qs-modal" onClick={e => e.stopPropagation()}>
                    <div className={`qs-result-header ${passed ? 'qs-result-header--pass' : 'qs-result-header--fail'}`}>
                        <div className="result-title-wrapper" style={{ display: "flex", flexDirection: "column" }}>
                            <h2 className="qs-result-title">{passed ? 'Well done!' : 'Keep practicing!'}</h2>
                            <p className="qs-result-sub">{quiz.title}</p>
                        </div>
                        <div className="qs-result-icon" style={{ cursor: "pointer" }} onClick={onClose}>
                            {passed ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="qs-result-body">
                        <div className="qs-score-ring-wrap">
                            <svg className="qs-score-ring" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={passed ? '#EC4899' : '#f87171'}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 50}`}
                                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                            </svg>
                            <div className="qs-score-ring-label">
                                <span className="qs-score-pct">{pct}%</span>
                                <span className="qs-score-fraction">{result.score}/{result.maxScore}</span>
                            </div>
                        </div>

                        <div className="qs-result-stats">
                            <div className="qs-stat">
                                <span className="qs-stat-val">{result.answers?.filter(a => a.isCorrect).length ?? '—'}</span>
                                <span className="qs-stat-label">Correct</span>
                            </div>
                            <div className="qs-stat">
                                <span className="qs-stat-val">{result.answers?.filter(a => !a.isCorrect).length ?? '—'}</span>
                                <span className="qs-stat-label">Wrong</span>
                            </div>
                            <div className="qs-stat">
                                {!completed ?
                                    <>
                                        <span className="qs-stat-val">{formatTime(elapsed)}</span>
                                        <span className="qs-stat-label">Time</span>
                                    </> :
                                    <>
                                        <span className="qs-stat-val">{completed}</span>
                                        <span className="qs-stat-label">Solved at</span>
                                    </>}
                            </div>
                        </div>

                        {/* Answer review */}
                        <div className="qs-review">
                            <p className="qs-review-title">Review</p>
                            {questions.map((question, i) => {
                                const answerRecord = result.answers?.find(a => a.questionId?.toString() === question._id?.toString())
                                const correct = answerRecord?.isCorrect
                                const studentAnswers = result.answers?.find(a => a.questionId?.toString() === question._id?.toString())?.responses || []
                                return (
                                    <div key={question._id} className={`qs-review-item ${correct ? 'qs-review-item--correct' : 'qs-review-item--wrong'}`}>
                                        <div className="qs-review-q">
                                            <span className="qs-review-num">Q{i + 1}</span>
                                            <span className="qs-review-text">{question.questionContent}</span>
                                            <span className={`qs-review-badge ${correct ? 'qs-review-badge--correct' : 'qs-review-badge--wrong'}`}>
                                                {correct ? '✓' : '✗'}
                                            </span>
                                        </div>
                                        <div className="qs-review-correct-ans qs-student-answers">
                                            <span>Your Answer: </span>
                                            {studentAnswers.join(', ')}
                                        </div>
                                        {!correct && (
                                            <>
                                                <div className="qs-review-correct-ans">
                                                    <span>Correct Answer: </span>
                                                    {question.correctAnswers.join(', ')}
                                                </div>
                                                {
                                                    question.explanation &&
                                                    <div className="qs-review-correct-ans qs-student-answers">
                                                        <span>Explanation: </span>
                                                        {question.explanation}
                                                    </div>}
                                            </>
                                        )}
                                        {question.explanation && (
                                            <div className="qs-review-explanation">{question.explanation}</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="qs-footer">
                        <button className="qs-footer-btn qs-footer-btn--close" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ── Solve screen ── */
    return (
        <div className="qs-overlay" onClick={onClose}>
            <div className="qs-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="qs-modal-header">
                    <div className="qs-modal-header-left">
                        <div className="qs-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="17" r="1" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="qs-modal-title">{quiz.title}</h2>
                            <p className="qs-modal-sub">{quiz.difficulty} · {questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="qs-header-right">
                        <div className="qs-timer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {formatTime(elapsed)}
                        </div>
                        <button className="qs-close-btn" onClick={onClose}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="qs-progress-bar-wrap">
                    <div className="qs-progress-bar" style={{ width: `${progressPct}%` }} />
                    <span className="qs-progress-label">{answeredCount}/{questions.length} answered</span>
                </div>

                <div className="qs-body">

                    {/* Sidebar: question list */}
                    <aside className="qs-sidebar">
                        <p className="qs-list-title">Questions</p>
                        {questions.map((q, i) => {
                            const answered = (answers[q._id] || []).length > 0
                            const hasError = !!errors[q._id]
                            return (
                                <div
                                    key={q._id}
                                    className={`qs-list-item 
                    ${i === activeQuestion ? 'qs-list-item--active' : ''} 
                    ${answered ? 'qs-list-item--answered' : ''} 
                    ${hasError ? 'qs-list-item--error' : ''}`}
                                    onClick={() => setActiveQuestion(i)}
                                >
                                    <span className="qs-list-num">Q{i + 1}</span>
                                    <span className="qs-list-preview">
                                        {q.questionContent.trim() || <em>Question {i + 1}</em>}
                                    </span>
                                    {answered && (
                                        <span className="qs-list-check">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </aside>

                    {/* Editor: question + options */}
                    <section className="qs-editor">
                        <div className="qs-editor-top">
                            <span className="qs-q-badge">Question {activeQuestion + 1}</span>
                            <span className="qs-points-badge">{q?.points || 1} pt{(q?.points || 1) !== 1 ? 's' : ''}</span>
                        </div>

                        <p className="qs-question-text">{q?.questionContent}</p>

                        {errors[q?._id] && (
                            <span className="qs-error">{errors[q._id]}</span>
                        )}

                        <div className="qs-options-list">
                            {q?.options.map((opt, oi) => {
                                const selected = (answers[q._id] || []).includes(opt)
                                return (
                                    <button
                                        key={oi}
                                        type="button"
                                        className={`qs-option-row ${selected ? 'qs-option-row--selected' : ''}`}
                                        onClick={() => toggleAnswer(q._id, opt)}
                                    >
                                        <span className={`qs-option-circle ${selected ? 'qs-option-circle--selected' : ''}`}>
                                            {selected && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="qs-option-letter">{String.fromCharCode(65 + oi)}</span>
                                        <span className="qs-option-text">{opt}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Nav buttons */}
                        <div className="qs-nav-btns">
                            <button
                                className="qs-nav-btn"
                                disabled={activeQuestion === 0}
                                onClick={() => setActiveQuestion(prev => prev - 1)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Previous
                            </button>
                            {activeQuestion < questions.length - 1 ? (
                                <button
                                    className="qs-nav-btn qs-nav-btn--next"
                                    onClick={() => setActiveQuestion(prev => prev + 1)}
                                >
                                    Next
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    className="qs-nav-btn qs-nav-btn--next qs-nav-btn--last"
                                    onClick={() => { }} // just visual, submit is in footer
                                >
                                    Last question
                                </button>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="qs-footer">
                    <button className="qs-footer-btn qs-footer-btn--cancel" onClick={handleSave}>
                        Cancel & Save
                    </button>
                    <div className="qs-footer-info">
                        <span>{answeredCount} of {questions.length} answered</span>
                    </div>
                    <button className="qs-footer-btn qs-footer-btn--submit" onClick={handleSubmit}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Submit Quiz
                    </button>
                </div>
            </div>
        </div>
    )
}

export default QuizSolve