import React, { useState } from 'react'
import '../Styles/QuizCourse.css'

const DIFFICULTY = ["Beginner", "Intermediate", "Advanced"]

const emptyQuestion = () => ({
  questionContent: "",
  options: ["", "", "", ""],
  correctAnswers: [],
  explanation: "",
  points: 1,
})

function QuizBuilder({ courseId, onClose, onPublish }) {
  const [quizMeta, setQuizMeta] = useState({
    title: "",
    description: "",
    difficulty: "Beginner",
  })

  const [questions, setQuestions] = useState([emptyQuestion()])
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [errors, setErrors] = useState({})

  /* ── helpers ── */
  const updateMeta = (field, value) =>
    setQuizMeta(prev => ({ ...prev, [field]: value }))

  const updateQuestion = (qIdx, field, value) => {
    setQuestions(prev => {
      const next = [...prev]
      next[qIdx] = { ...next[qIdx], [field]: value }
      return next
    })
  }

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(prev => {
      const next = [...prev]
      const opts = [...next[qIdx].options]
      const oldVal = opts[optIdx]
      opts[optIdx] = value
      // keep correctAnswers in sync if user edits an option text
      const corrected = next[qIdx].correctAnswers.map(a => a === oldVal ? value : a)
      next[qIdx] = { ...next[qIdx], options: opts, correctAnswers: corrected }
      return next
    })
  }

  const toggleCorrect = (qIdx, optVal) => {
    setQuestions(prev => {
      const next = [...prev]
      const q = next[qIdx]
      const already = q.correctAnswers.includes(optVal)
      next[qIdx] = {
        ...q,
        correctAnswers: already
          ? q.correctAnswers.filter(a => a !== optVal)
          : [...q.correctAnswers, optVal],
      }
      return next
    })
  }

  const addOption = (qIdx) => {
    setQuestions(prev => {
      const next = [...prev]
      next[qIdx] = { ...next[qIdx], options: [...next[qIdx].options, ""] }
      return next
    })
  }

  const removeOption = (qIdx, optIdx) => {
    setQuestions(prev => {
      const next = [...prev]
      const opts = next[qIdx].options.filter((_, i) => i !== optIdx)
      const corrected = next[qIdx].correctAnswers.filter(a => a !== next[qIdx].options[optIdx])
      next[qIdx] = { ...next[qIdx], options: opts, correctAnswers: corrected }
      return next
    })
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion()])
    setActiveQuestion(questions.length)
  }

  const removeQuestion = (idx) => {
    if (questions.length === 1) return
    const next = questions.filter((_, i) => i !== idx)
    setQuestions(next)
    setActiveQuestion(Math.min(activeQuestion, next.length - 1))
  }

  /* ── validation ── */
  const validate = () => {
    const e = {}
    if (!quizMeta.title.trim()) e.title = "Quiz title is required."
    questions.forEach((q, i) => {
      if (!q.questionContent.trim()) e[`q${i}_content`] = "Question text is required."
      if (q.options.some(o => !o.trim())) e[`q${i}_options`] = "All option fields must be filled."
      if (q.correctAnswers.length === 0) e[`q${i}_correct`] = "Mark at least one correct answer."
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePublish = () => {
    if (!validate()) return
    const payload = {
      ...quizMeta,
      questions,
    }
    onPublish?.(payload)
  }

  const q = questions[activeQuestion]

  return (
    <div className="qb-overlay" onClick={onClose}>
      <div className="qb-modal" onClick={e => e.stopPropagation()}>

        {/* ── Modal header ── */}
        <div className="qb-modal-header">
          <div className="qb-modal-header-left">
            <div className="qb-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="1" fill="white"/>
              </svg>
            </div>
            <div>
              <h2 className="qb-modal-title">Create Quiz</h2>
              <p className="qb-modal-sub">{questions.length} question{questions.length !== 1 ? 's' : ''} · {quizMeta.difficulty}</p>
            </div>
          </div>
          <button className="qb-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="qb-body">

          {/* ── LEFT: Quiz meta + question list ── */}
          <aside className="qb-sidebar">
            <div className="qb-meta-section">
              <div className="qb-field">
                <label className="qb-label">Quiz Title</label>
                <input
                  className={`qb-input ${errors.title ? 'qb-input--error' : ''}`}
                  placeholder="e.g. Chapter 1 Quiz"
                  value={quizMeta.title}
                  onChange={e => { updateMeta('title', e.target.value); setErrors(p => ({...p, title: ''})) }}
                />
                {errors.title && <span className="qb-error">{errors.title}</span>}
              </div>
              <div className="qb-field">
                <label className="qb-label">Description <span className="qb-optional">(optional)</span></label>
                <textarea
                  className="qb-textarea"
                  placeholder="What is this quiz about?"
                  rows={2}
                  value={quizMeta.description}
                  onChange={e => updateMeta('description', e.target.value)}
                />
              </div>
              <div className="qb-field">
                <label className="qb-label">Difficulty</label>
                <div className="qb-difficulty-pills">
                  {DIFFICULTY.map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`qb-pill ${quizMeta.difficulty === d ? 'qb-pill--active' : ''}`}
                      onClick={() => updateMeta('difficulty', d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="qb-question-list">
              <p className="qb-list-title">Questions</p>
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`qb-list-item ${i === activeQuestion ? 'qb-list-item--active' : ''} ${(errors[`q${i}_content`] || errors[`q${i}_options`] || errors[`q${i}_correct`]) ? 'qb-list-item--error' : ''}`}
                  onClick={() => setActiveQuestion(i)}
                >
                  <span className="qb-list-num">Q{i + 1}</span>
                  <span className="qb-list-preview">
                    {q.questionContent.trim() || <em>Untitled question</em>}
                  </span>
                  {questions.length > 1 && (
                    <button
                      className="qb-list-del"
                      onClick={e => { e.stopPropagation(); removeQuestion(i) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button className="qb-add-question-btn" onClick={addQuestion}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Add Question
              </button>
            </div>
          </aside>

          {/* ── RIGHT: Question editor ── */}
          <section className="qb-editor">
            <div className="qb-editor-top">
              <span className="qb-q-badge">Question {activeQuestion + 1}</span>
              <div className="qb-points-wrap">
                <label className="qb-label">Points</label>
                <input
                  type="number"
                  className="qb-points-input"
                  min={1}
                  value={q.points}
                  onChange={e => updateQuestion(activeQuestion, 'points', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="qb-field">
              <label className="qb-label">Question</label>
              <textarea
                className={`qb-textarea qb-textarea--question ${errors[`q${activeQuestion}_content`] ? 'qb-input--error' : ''}`}
                placeholder="Type your question here..."
                rows={3}
                value={q.questionContent}
                onChange={e => { updateQuestion(activeQuestion, 'questionContent', e.target.value); setErrors(p => ({...p, [`q${activeQuestion}_content`]: ''})) }}
              />
              {errors[`q${activeQuestion}_content`] && <span className="qb-error">{errors[`q${activeQuestion}_content`]}</span>}
            </div>

            <div className="qb-field">
              <label className="qb-label">
                Answer Options
                <span className="qb-hint"> — click the circle to mark correct</span>
              </label>
              {(errors[`q${activeQuestion}_options`] || errors[`q${activeQuestion}_correct`]) && (
                <span className="qb-error">
                  {errors[`q${activeQuestion}_options`] || errors[`q${activeQuestion}_correct`]}
                </span>
              )}
              <div className="qb-options-list">
                {q.options.map((opt, oi) => {
                  const isCorrect = q.correctAnswers.includes(opt) && opt.trim() !== ''
                  return (
                    <div key={oi} className={`qb-option-row ${isCorrect ? 'qb-option-row--correct' : ''}`}>
                      <button
                        type="button"
                        className={`qb-correct-btn ${isCorrect ? 'qb-correct-btn--active' : ''}`}
                        onClick={() => opt.trim() && toggleCorrect(activeQuestion, opt)}
                        title="Mark as correct"
                      >
                        {isCorrect ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : null}
                      </button>
                      <span className="qb-option-letter">{String.fromCharCode(65 + oi)}</span>
                      <input
                        className="qb-option-input"
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        value={opt}
                        onChange={e => { updateOption(activeQuestion, oi, e.target.value); setErrors(p => ({...p, [`q${activeQuestion}_options`]: '', [`q${activeQuestion}_correct`]: ''})) }}
                      />
                      {q.options.length > 2 && (
                        <button className="qb-opt-del" onClick={() => removeOption(activeQuestion, oi)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {q.options.length < 6 && (
                <button className="qb-add-option-btn" onClick={() => addOption(activeQuestion)}>
                  + Add option
                </button>
              )}
            </div>

            <div className="qb-field">
              <label className="qb-label">Explanation <span className="qb-optional">(optional)</span></label>
              <textarea
                className="qb-textarea"
                placeholder="Explain why the correct answer is correct..."
                rows={2}
                value={q.explanation}
                onChange={e => updateQuestion(activeQuestion, 'explanation', e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="qb-footer">
          <button className="qb-footer-btn qb-footer-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <div className="qb-footer-right">
            <button className="qb-footer-btn qb-footer-btn--add" onClick={addQuestion}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              New Question
            </button>
            <button className="qb-footer-btn qb-footer-btn--publish" onClick={handlePublish}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Publish Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizBuilder