import React, { useContext, useState } from 'react'
import '../Styles/QuizCourse.css'
import { AppContext } from '../../../App'

const DIFFICULTY_COLOR = {
    Beginner:     { bg: '#dcfce7', color: '#16a34a' },
    Intermediate: { bg: '#fef9c3', color: '#ca8a04' },
    Advanced:     { bg: '#fee2e2', color: '#dc2626' },
}

function QuizViewer({ quiz, onClose, onEdit, teacherId }) {
    const [activeQuestion, setActiveQuestion] = useState(0)
    const { userAuth } = useContext(AppContext)

    if (!quiz) return null

    const q        = quiz.questions[activeQuestion]
    const diffStyle = DIFFICULTY_COLOR[quiz.difficulty] ?? DIFFICULTY_COLOR.Beginner
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points ?? 1), 0)

    return (
        <div className="qb-overlay" onClick={onClose}>
            <div className="qb-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="qb-modal-header">
                    <div className="qb-modal-header-left">
                        <div className="qb-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="qb-modal-title">{quiz.title}</h2>
                            <p className="qb-modal-sub">
                                {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                &nbsp;·&nbsp;{totalPoints} pts
                                &nbsp;·&nbsp;{quiz.difficulty}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {onEdit && teacherId === userAuth.userId && (
                            <button
                                className="qb-close-btn"
                                onClick={onEdit}
                                title="Edit quiz"
                                style={{ width: 'auto', borderRadius: '20px', padding: '0 0.9rem', gap: '0.4rem', fontSize: '0.82rem', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                                        stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                        stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Edit
                            </button>
                        )}
                        <button className="qb-close-btn" onClick={onClose}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="qb-body">

                    {/* ── Sidebar ── */}
                    <aside className="qb-sidebar">

                        {/* Quiz meta */}
                        <div className="qb-meta-section">
                            {quiz.description && (
                                <p style={{
                                    fontFamily: "'Nunito', sans-serif",
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}>
                                    {quiz.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontFamily: "'Nunito', sans-serif",
                                    fontWeight: 700,
                                    background: diffStyle.bg,
                                    color: diffStyle.color,
                                }}>
                                    {quiz.difficulty}
                                </span>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontFamily: "'Nunito', sans-serif",
                                    fontWeight: 700,
                                    background: '#f0f4ff',
                                    color: '#4f46e5',
                                }}>
                                    {totalPoints} pts total
                                </span>
                            </div>
                        </div>

                        {/* Question list */}
                        <div className="qb-question-list">
                            <p className="qb-list-title">Questions</p>
                            {quiz.questions.map((question, i) => (
                                <div
                                    key={i}
                                    className={`qb-list-item ${i === activeQuestion ? 'qb-list-item--active' : ''}`}
                                    onClick={() => setActiveQuestion(i)}
                                >
                                    <span className="qb-list-num">Q{i + 1}</span>
                                    <span className="qb-list-preview">
                                        {question.questionContent.trim() || <em>Untitled question</em>}
                                    </span>
                                    {/* correct answer count badge */}
                                    <span style={{
                                        flexShrink: 0,
                                        fontSize: '0.68rem',
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 800,
                                        background: '#dcfce7',
                                        color: '#16a34a',
                                        borderRadius: '20px',
                                        padding: '2px 6px',
                                    }}>
                                        {question.correctAnswers.length}✓
                                    </span>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* ── Editor / Viewer pane ── */}
                    <section className="qb-editor">

                        {/* Question header */}
                        <div className="qb-editor-top">
                            <span className="qb-q-badge">Question {activeQuestion + 1}</span>
                            <span style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                background: '#f0f4ff',
                                color: '#4f46e5',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '20px',
                            }}>
                                {q.points ?? 1} pt{(q.points ?? 1) !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Question text */}
                        <div className="qb-field">
                            <label className="qb-label">Question</label>
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                border: '1.5px solid #e2e4e5',
                                background: '#fafafa',
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: '0.97rem',
                                color: '#1E293B',
                                lineHeight: 1.6,
                                minHeight: '60px',
                            }}>
                                {q.questionContent || <span style={{ color: '#C4C4C4', fontStyle: 'italic' }}>No question text</span>}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="qb-field">
                            <label className="qb-label">
                                Answer Options
                                <span className="qb-hint"> — green = correct answer</span>
                            </label>
                            <div className="qb-options-list">
                                {q.options.map((opt, oi) => {
                                    const isCorrect = q.correctAnswers.includes(opt) && opt.trim() !== ''
                                    return (
                                        <div
                                            key={oi}
                                            className={`qb-option-row ${isCorrect ? 'qb-option-row--correct' : ''}`}
                                            style={{ cursor: 'default' }}
                                        >
                                            {/* correct indicator */}
                                            <div className={`qb-correct-btn ${isCorrect ? 'qb-correct-btn--active' : ''}`}
                                                style={{ cursor: 'default', pointerEvents: 'none' }}>
                                                {isCorrect && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3"
                                                            strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </div>

                                            <span className="qb-option-letter">
                                                {String.fromCharCode(65 + oi)}
                                            </span>

                                            <span style={{
                                                flex: 1,
                                                fontFamily: "'Nunito', sans-serif",
                                                fontSize: '0.9rem',
                                                color: isCorrect ? '#15803d' : '#1E293B',
                                                fontWeight: isCorrect ? 700 : 400,
                                            }}>
                                                {opt || <span style={{ color: '#C4C4C4', fontStyle: 'italic' }}>Empty option</span>}
                                            </span>

                                            {isCorrect && (
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontFamily: "'Nunito', sans-serif",
                                                    fontWeight: 800,
                                                    color: '#16a34a',
                                                    background: '#dcfce7',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    flexShrink: 0,
                                                }}>
                                                    Correct
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                            <div className="qb-field">
                                <label className="qb-label">Explanation</label>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    border: '1.5px solid #fde68a',
                                    background: '#fffbeb',
                                    fontFamily: "'Nunito', sans-serif",
                                    fontSize: '0.88rem',
                                    color: '#92400e',
                                    lineHeight: 1.6,
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'flex-start',
                                }}>
                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                                    {q.explanation}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 'auto',
                            paddingTop: '0.5rem',
                        }}>
                            <button
                                className="qb-footer-btn qb-footer-btn--cancel"
                                disabled={activeQuestion === 0}
                                onClick={() => setActiveQuestion(p => p - 1)}
                                style={{ opacity: activeQuestion === 0 ? 0.4 : 1, cursor: activeQuestion === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                ← Prev
                            </button>
                            <span style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: '0.85rem',
                                color: '#8E8E8E',
                                alignSelf: 'center',
                            }}>
                                {activeQuestion + 1} / {quiz.questions.length}
                            </span>
                            <button
                                className="qb-footer-btn qb-footer-btn--cancel"
                                disabled={activeQuestion === quiz.questions.length - 1}
                                onClick={() => setActiveQuestion(p => p + 1)}
                                style={{ opacity: activeQuestion === quiz.questions.length - 1 ? 0.4 : 1, cursor: activeQuestion === quiz.questions.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Next →
                            </button>
                        </div>
                    </section>
                </div>

                {/* ── Footer ── */}
                <div className="qb-footer">
                    <div style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: '0.85rem',
                        color: '#8E8E8E',
                        display: 'flex',
                        gap: '1rem',
                    }}>
                        <span>📋 {quiz.questions.length} questions</span>
                        <span>⭐ {totalPoints} total points</span>
                        <span>✅ {quiz.questions.reduce((s, q) => s + q.correctAnswers.length, 0)} correct answers defined</span>
                    </div>
                    <div className="qb-footer-right">
                        <button className="qb-footer-btn qb-footer-btn--cancel" onClick={onClose}>
                            Close
                        </button>
                        {onEdit && teacherId === userAuth.userId && (
                            <button className="qb-footer-btn qb-footer-btn--publish" onClick={onEdit}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                                        stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                        stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Edit Quiz
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default QuizViewer