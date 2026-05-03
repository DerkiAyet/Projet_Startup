import React, { useEffect, useState } from 'react'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import { ReactComponent as TargetIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg'
import JoditEditor from "jodit-react"
import "../Styles/AssignmentReview.css"
import HeaderReviewContent from '../Components/HeaderReviewContent'
import ToastMessage from '../../../Partials/Components/ToastMessage'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function AssignmentReview() {

    const { solutionId } = useParams();

    const [solution, setSolution] = useState(null);
    const [assignment, setAssignment] = useState({});
    const [exercises, setExercises] = useState([]);
    const [studentInfo, setStudentInfo] = useState({});
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [teacherReview, setTeacherReview] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' });
    const [submitting, setSubmitting] = useState(false);

    const triggerToast = (message, subMessage = 'Just now') => {
        setToast({ visible: true, message, subMessage });
    };

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/solutions/${solutionId}`)
            .then(response => {
                const sol = response.data.solution;
                const assign = response.data.assignment;
                const student = response.data.student;

                setSolution(sol);
                setAssignment(assign);
                setExercises(assign.exercises);
                setStudentInfo(student);

                // initialize teacherReview with existing grades if already reviewed
                setTeacherReview(
                    sol.problemsSolved.map(p => ({
                        exerciseId: p.exerciseId,
                        grade: p.grade ?? "",
                        teacherExplanation: p.teacherExplanation ?? ""
                    }))
                );
            })
            .catch(err => console.error("Error fetching solution:", err));
    }, [solutionId]);

    const currentExercise = exercises[currentExerciseIndex] || {};
    const currentProblem = solution?.problemsSolved?.[currentExerciseIndex] || {};
    const currentReview = teacherReview[currentExerciseIndex] || {};

    const updateReview = (field, value) => {
        const updated = [...teacherReview];
        updated[currentExerciseIndex] = {
            ...updated[currentExerciseIndex],
            [field]: value
        };
        setTeacherReview(updated);
    };

    const handleGrade = async () => {
        setSubmitting(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/solutions/${solutionId}/teacher-grade`,
                { teacherReview }
            );
            triggerToast("Graded successfully!", "Student will be notified.");
        } catch (err) {
            console.error("Error grading:", err);
            triggerToast("Error", "Failed to submit grades.");
        } finally {
            setSubmitting(false);
        }
    };

    const goTo = (index) => {
        if (index >= 0 && index < exercises.length) {
            setCurrentExerciseIndex(index);
        }
    };

    if (!solution) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Nunito', sans-serif" }}>
            Loading...
        </div>
    );

    return (
        <div className='as-container'>
            <HeaderReviewContent
                title={assignment?.title}
                studentName={`${studentInfo.givenName} ${studentInfo.familyName}`}
                assignmentLevel={assignment?.level}
                submittedAt={solution?.solvedAt}
                status={solution?.status}
                totalScore={teacherReview.reduce((sum, r) => sum + (parseFloat(r.grade) || 0), 0)}
                maxScore={exercises.reduce((sum, ex) =>
                    sum + (ex.exerciseType === "mcq"
                        ? (ex.questions || []).reduce((s, q) => s + (q.points || 1), 0)
                        : (ex.points || 0)), 0)}
                handleSubmit={handleGrade}
                submitting={submitting}
            />

            <div className="as-main">
                <div className="solution-sheet left-side">
                    <div className="lesson-editor-container">

                        {/* Nav bar */}
                        <div className="lesson-nav-bar">
                            <button
                                className="lesson-nav-btn"
                                disabled={currentExerciseIndex === 0}
                                onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
                            >
                                <BackIcon className="lesson-icon" />
                                Previous
                            </button>
                            <div className="lesson-nav-info">
                                <span className="lesson-counter">
                                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                                </span>
                                <div className="lesson-title-input">
                                    {exercises?.[currentExerciseIndex]?.title || "Untitled Exercise"}
                                </div>
                            </div>
                            <button
                                className="lesson-nav-btn lesson-nav-btn--next"
                                disabled={currentExerciseIndex === exercises.length - 1}
                                onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
                            >
                                Next <BackIcon className="lesson-icon rotate-180" />
                            </button>
                        </div>

                        {/* Points + type badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", paddingLeft: "0.2rem" }}>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>
                                Points
                            </span>
                            <div className="points-box">
                                {currentExercise?.exerciseType === "mcq"
                                    ? `${(currentExercise.questions || []).reduce((sum, q) => sum + (q.points || 1), 0)} pts`
                                    : `${currentExercise?.points || 0} pts`}
                            </div>
                            <div style={{
                                padding: "0.2rem 0.7rem", borderRadius: "20px", fontSize: "0.78rem",
                                fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                                background: currentExercise?.exerciseType === "mcq" ? "#ECFDF5"
                                    : currentExercise?.exerciseType === "file" ? "#EFF6FF" : "#FDF2F8",
                                color: currentExercise?.exerciseType === "mcq" ? "#10B981"
                                    : currentExercise?.exerciseType === "file" ? "#3B82F6" : "#EC4899",
                            }}>
                                {currentExercise?.exerciseType === "mcq" ? "MCQ"
                                    : currentExercise?.exerciseType === "file" ? "File" : "Text"}
                            </div>
                        </div>

                        {/* ── Exercise statement (what the teacher wrote) ── */}
                        <div className="exercise-statement-box">
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#8E8E8E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Exercise Statement
                            </p>

                            {/* TEXT */}
                            {(currentExercise?.exerciseType === "text" || !currentExercise?.exerciseType) && (
                                <div className="as-exercise-card">
                                    <div className="as-page-number">Exercise {currentExerciseIndex + 1}</div>
                                    <div className="as-page-content" dangerouslySetInnerHTML={{ __html: currentExercise?.content }} />
                                </div>
                            )}

                            {/* FILE */}
                            {currentExercise?.exerciseType === "file" && (
                                <div className="as-exercise-card">
                                    <div className="as-page-number">Exercise {currentExerciseIndex + 1}</div>
                                    {currentExercise?.fileUrl ? (
                                        currentExercise.fileUrl.toLowerCase().endsWith(".pdf") ? (
                                            <iframe
                                                src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${currentExercise.fileUrl}`}
                                                title={currentExercise.title}
                                                style={{ width: "100%", height: "300px", border: "none", borderRadius: "10px" }}
                                            />
                                        ) : (
                                            <img
                                                src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${currentExercise.fileUrl}`}
                                                alt={currentExercise.title}
                                                style={{ width: "100%", borderRadius: "10px", objectFit: "contain" }}
                                            />
                                        )
                                    ) : (
                                        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#8E8E8E", textAlign: "center" }}>No file attached.</p>
                                    )}
                                </div>
                            )}

                            {/* MCQ */}
                            {currentExercise?.exerciseType === "mcq" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {(currentExercise.questions || []).map((q, qIdx) => {
                                        const studentAnswer = currentProblem?.mcqAnswers?.find(a => a.questionId === q._id);
                                        const selected = studentAnswer?.selected || [];

                                        return (
                                            <div className="as-exercise-card" key={qIdx}>
                                                <div className="as-page-number">{q.points || 1} pt{q.points !== 1 ? "s" : ""}</div>
                                                <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.97rem", color: "#1E293B", marginBottom: "1rem" }}>
                                                    {qIdx + 1}. {q.questionContent}
                                                </p>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    {(q.options || []).map((opt, oIdx) => {
                                                        const isSelected = selected.includes(opt.text);
                                                        const isCorrect = opt.isCorrect;
                                                        // color coding: green = correct, red = wrong selection, grey = not selected
                                                        let bg = "#fff", border = "1.5px solid #A7A7A7", color = "#1E293B";
                                                        if (isCorrect) { bg = "#ECFDF5"; border = "1.5px solid #10B981"; color = "#10B981"; }
                                                        if (isSelected && !isCorrect) { bg = "#FFF5F5"; border = "1.5px solid #EF4444"; color = "#EF4444"; }
                                                        if (isSelected && isCorrect) { bg = "#ECFDF5"; border = "1.5px solid #10B981"; color = "#10B981"; }

                                                        return (
                                                            <div key={oIdx} style={{
                                                                display: "flex", alignItems: "center", gap: "0.75rem",
                                                                padding: "0.7rem 1rem", borderRadius: "10px",
                                                                border, fontFamily: "'Nunito', sans-serif",
                                                                fontSize: "0.92rem", color
                                                            }}>
                                                                <div style={{
                                                                    width: "20px", height: "20px", borderRadius: q.allowMultiple ? "4px" : "50%",
                                                                    border: `2px solid ${color}`, display: "flex", alignItems: "center",
                                                                    justifyContent: "center", flexShrink: 0,
                                                                    background: (isSelected || isCorrect) ? color : "transparent"
                                                                }}>
                                                                    {(isSelected || isCorrect) && (
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                {opt.text}
                                                                {isCorrect && <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700 }}>✓ Correct</span>}
                                                                {isSelected && !isCorrect && <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700 }}>✗ Wrong</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* auto grade indicator */}
                                                <div style={{
                                                    marginTop: "0.8rem", padding: "0.5rem 0.8rem", borderRadius: "8px",
                                                    background: studentAnswer?.isCorrect ? "#ECFDF5" : "#FFF5F5",
                                                    fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", fontWeight: 700,
                                                    color: studentAnswer?.isCorrect ? "#10B981" : "#EF4444"
                                                }}>
                                                    {studentAnswer?.isCorrect ? "✓ Correct answer" : "✗ Incorrect answer"}
                                                    {q.explanation && (
                                                        <p style={{ marginTop: "0.3rem", fontWeight: 400, color: "#8E8E8E" }}>
                                                            {q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── Student answer ── */}
                        <div style={{
                            display: "flex", flexDirection: "column", gap: "0.6rem",
                            padding: "1rem", borderRadius: "12px",
                            border: "1.5px solid #A7A7A7", background: "#FAFAFA"
                        }}>
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#8E8E8E", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                                Student Answer
                            </p>

                            {/* text/file → show written solution */}
                            {(currentExercise?.exerciseType === "text" || currentExercise?.exerciseType === "file" || !currentExercise?.exerciseType) && (
                                (currentProblem?.solution || currentProblem?.fileUrl) ? (
                                    <>
                                        {currentProblem?.fileUrl && (
                                            currentProblem.fileUrl.toLowerCase().endsWith(".pdf") ?
                                                (
                                                    <iframe
                                                        src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${currentProblem.fileUrl}`}
                                                        title={currentExercise.title}
                                                        style={{ width: "100%", height: "300px", border: "none", borderRadius: "10px" }}
                                                    />
                                                ) :
                                                (
                                                    <img
                                                        src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${currentProblem.fileUrl}`}
                                                        alt={currentExercise.title}
                                                        style={{ width: "100%", borderRadius: "10px", objectFit: "contain" }}
                                                    />
                                                )
                                        )}
                                        {currentProblem?.solution && <div
                                            className="as-page-content"
                                            style={{ padding: "0.5rem", background: "#fff", borderRadius: "8px", border: "1px solid #E2E4E5" }}
                                            dangerouslySetInnerHTML={{ __html: currentProblem.solution }}
                                        />}
                                    </>
                                ) : (
                                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "#8E8E8E", fontSize: "0.9rem", fontStyle: "italic" }}>
                                        No written answer provided.
                                    </p>
                                )
                            )}

                            {/* mcq → show score summary */}
                            {currentExercise?.exerciseType === "mcq" && (
                                <div style={{
                                    padding: "0.7rem 1rem", borderRadius: "10px",
                                    background: "#fff", border: "1px solid #E2E4E5",
                                    fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "#1E293B"
                                }}>
                                    Auto-graded MCQ — score calculated automatically on submission.
                                </div>
                            )}
                        </div>

                        {/* ── Teacher grading section (not for MCQ — auto graded) ── */}
                        {currentExercise?.exerciseType !== "mcq" && (
                            <div style={{
                                display: "flex", flexDirection: "column", gap: "1rem",
                                padding: "1.2rem", borderRadius: "12px",
                                border: "1.5px solid #EC489980", background: "#FDF2F8"
                            }}>
                                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#EC4899", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                                    Your Grading
                                </p>

                                {/* Grade input */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1E293B" }}>
                                        Grade
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={currentExercise?.points || 100}
                                        placeholder="0"
                                        value={currentReview?.grade ?? ""}
                                        onChange={(e) => updateReview("grade", parseFloat(e.target.value) || 0)}
                                        style={{
                                            width: "90px", padding: "0.4rem 0.7rem", borderRadius: "10px",
                                            border: "1.5px solid #EC489980", fontSize: "0.95rem", outline: "none",
                                            fontFamily: "'Nunito', sans-serif", background: "#fff"
                                        }}
                                    />
                                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#8E8E8E" }}>
                                        / {currentExercise?.exerciseType === "mcq"
                                            ? (currentExercise.questions || []).reduce((sum, q) => sum + (q.points || 1), 0)
                                            : (currentExercise?.points || 0)} pts
                                    </span>
                                </div>

                                {/* Explanation editor */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "#1E293B" }}>
                                        Explanation / Feedback
                                    </span>
                                    <JoditEditor
                                        key={`review-${currentExerciseIndex}`}
                                        value={currentReview?.teacherExplanation || ""}
                                        onBlur={(val) => updateReview("teacherExplanation", val)}
                                        config={{
                                            uploader: { insertImageAsBase64URI: true },
                                            toolbarAdaptive: false,
                                            height: "auto",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Progress dots */}
                        <div className="lesson-editor-actions">
                            <div className="lesson-editor-actions-right">
                                <span className="lesson-dots">
                                    {exercises.map((_, i) => {
                                        const reviewed = teacherReview[i]?.grade !== "" && teacherReview[i]?.grade !== undefined;
                                        return (
                                            <span
                                                key={i}
                                                className={`lesson-dot ${i === currentExerciseIndex ? "lesson-dot--active" : ""} ${reviewed ? "lesson-dot--filled" : ""}`}
                                                onClick={() => goTo(i)}
                                            />
                                        );
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Submit grades button */}
                        <button
                            className="submit-btn"
                            onClick={handleGrade}
                            disabled={submitting}
                            style={{
                                alignSelf: "flex-end", height: "46px", padding: "0 2rem",
                                borderRadius: "30px", border: "2px solid #EC4899",
                                background: submitting ? "#EC489960" : "transparent",
                                color: "#EC4899", fontFamily: "'Nunito', sans-serif",
                                fontWeight: 700, fontSize: "0.95rem", cursor: submitting ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {submitting ? "Submitting..." : "Submit Grades"}
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="cd-sidebar">
                    <div className="cd-sidebar-card">
                        <div className="cd-sidebar-card-header">
                            <h4 className="cd-sidebar-card-title">Assignment Details</h4>
                        </div>
                        <p className="cd-course-title-text">{assignment.title}</p>

                        {/* Student info */}
                        <div className="cd-teacher-row">
                            <div className="cd-teacher-avatar" style={{ background: "#EC489922", color: "#EC4899" }}>
                                {`${studentInfo?.familyName?.charAt(0) || ""}${studentInfo?.givenName?.charAt(0) || ""}`}
                            </div>
                            <div>
                                <p className="cd-teacher-label">Student</p>
                                <p className="cd-teacher-name">{studentInfo?.givenName} {studentInfo?.familyName}</p>
                            </div>
                        </div>

                        {/* Grading progress */}
                        <div className="cd-progress-section">
                            <div className="cd-progress-label">
                                <span>Grading progress</span>
                                <span className="cd-progress-pct">
                                    {teacherReview.filter(r => r.grade !== "" && r.grade !== undefined).length} / {exercises.length}
                                </span>
                            </div>
                            <div className="cd-progress-track">
                                <div className="cd-progress-fill" style={{
                                    width: `${(teacherReview.filter(r => r.grade !== "" && r.grade !== undefined).length / Math.max(exercises.length, 1)) * 100}%`
                                }} />
                            </div>
                        </div>

                        {/* Score summary */}
                        <div className="cd-details-grid">
                            <div className="cd-detail-item">
                                <LessonIcon className="detail-item-icon" />
                                <div>
                                    <p className="cd-detail-label">Exercises</p>
                                    <p className="cd-detail-val">{exercises.length}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <TargetIcon />
                                <div>
                                    <p className="cd-detail-label">Total Score</p>
                                    <p className="cd-detail-val">
                                        {teacherReview.reduce((sum, r) => sum + (parseFloat(r.grade) || 0), 0)}
                                        {" / "}
                                        {exercises.reduce((sum, ex) =>
                                            sum + (ex.exerciseType === "mcq"
                                                ? (ex.questions || []).reduce((s, q) => s + (q.points || 1), 0)
                                                : (ex.points || 0)), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="cd-tags">
                            <span className="cd-tag">{assignment?.level}</span>
                            <span className={`cd-tag`} style={{
                                background: solution?.status === "graded" ? "#ECFDF5" : "#FFFBEB",
                                color: solution?.status === "graded" ? "#10B981" : "#F59E0B"
                            }}>
                                {solution?.status || "submitted"}
                            </span>
                        </div>
                    </div>

                    {/* Exercise list */}
                    <div className="cd-sidebar-card">
                        <h4 className="cd-sidebar-card-title">Exercises</h4>
                        <div className="cd-lesson-list">
                            {exercises.map((e, i) => {
                                const reviewed = teacherReview[i]?.grade !== "" && teacherReview[i]?.grade !== undefined;
                                return (
                                    <button
                                        key={i}
                                        className={`cd-lesson-list-item ${i === currentExerciseIndex ? "cd-lesson-list-item--active" : ""} ${reviewed ? "cd-lesson-list-item--done" : ""}`}
                                        onClick={() => goTo(i)}
                                    >
                                        <span className="cd-lesson-num">{i + 1}</span>
                                        <span className="cd-lesson-list-title">{e.title}</span>
                                        {reviewed && (
                                            <span style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700, color: "#10B981" }}>
                                                {teacherReview[i].grade} pts
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            <ToastMessage
                visible={toast.visible}
                message={toast.message}
                subMessage={toast.subMessage}
                onClose={() => setToast(t => ({ ...t, visible: false }))}
            />
        </div>
    );
}

export default AssignmentReview;