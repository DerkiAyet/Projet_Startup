import React, { useEffect, useState, useMemo } from 'react'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import { ReactComponent as TargetIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg'
import { ReactComponent as TimerIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg';
import { ReactComponent as DoneIcon } from '../../../Assets/icons/CourseIcons/done-icon.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg';
import { ReactComponent as CalcIcon } from '../../../Assets/icons/CourseIcons/calculator.svg';
import { ReactComponent as CodeIcon } from '../../../Assets/icons/CourseIcons/code.svg';
import JoditEditor from "jodit-react"
import "../Styles/AssignmentSolve.css"
import HeaderContent from '../Components/HeaderContent'
import SubmitAssignmentConfirm from '../Components/SubmitAssignmentConfirm';
import SubmitAssignmentSuccess from '../Components/SubmitAssignmentSucess';
import ToastMessage from '../../../Partials/Components/ToastMessage';
import Calculator from '../Components/Calculator';
import { useParams } from 'react-router-dom';
import axios from 'axios'
import CodePanel from '../Components/CodeEditor';

const RECOMMENDATIONS = [
  {
    id: 1,
    thumb: "📐",
    thumbBg: "#FDF2F8",
    title: "Linear Algebra Basics",
    desc: "Vectors, matrices and transformations",
    level: "Beginner",
  },
  {
    id: 2,
    thumb: "📊",
    thumbBg: "#F0F9FF",
    title: "Statistics & Probability",
    desc: "Foundations of data analysis",
    level: "Intermediate",
  },
  {
    id: 3,
    thumb: "🔢",
    thumbBg: "#ECFDF5",
    title: "Number Theory",
    desc: "Primes, divisibility & congruences",
    level: "Advanced",
  },
  {
    id: 4,
    thumb: "📈",
    thumbBg: "#FFFBEB",
    title: "Differential Equations",
    desc: "Modeling with ODEs and PDEs",
    level: "Advanced",
  },
];

const LEVEL_COLOR = {
  Beginner: { color: "#10B981", bg: "#ECFDF5" },
  Intermediate: { color: "#F59E0B", bg: "#FFFBEB" },
  Advanced: { color: "#EC4899", bg: "#FDF2F8" },
};

function AssignmentSolve() {

  const { id } = useParams();

  const [assignmentData, setAssignmentData] = useState({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = React.useState(0);
  const [exercises, setExercises] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({});

  const [problemsSolved, setProblemsSolved] = useState([]);
  const [status, setStatus] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignmentRes = await axios.get(
          `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/${id}`
        );

        const assignment = assignmentRes.data.assignment;

        setAssignmentData(assignment);
        setExercises(assignment.exercises);
        setTeacherInfo(assignmentRes.data.teacher);

        try {
          const solutionRes = await axios.get(
            `${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/my-solutions/${id}`
          );

          setProblemsSolved(solutionRes.data.problemsSolved);
          setStatus(solutionRes.data.status)

        } catch {
          // fallback using fresh assignment (NOT state)
          const fallback = assignment.exercises.map(ex => ({
            exerciseId: ex._id,
            exerciseType: ex.exerciseType || "text",
            solution: "",
            mcqAnswers: (ex.questions || []).map(q => ({
              questionId: q._id,
              selected: []
            })),
            grade: null,
            teacherExplanation: "",
            localFile: null, // for the pass file option
            fileUrl: ""
          }));

          setProblemsSolved(fallback);
        }

      } catch (error) {
        console.error("Error fetching assignment data:", error);
      }
    };

    fetchData(); //by this we will make sure no fallback would happen because apparently the second call depends on the result of first call
  }, [id]);

  const currentExercise = exercises[currentExerciseIndex] || {};


  const updateCurrentSolution = (field, value) => {
    const solutions = [...problemsSolved];
    solutions[currentExerciseIndex] = {
      ...solutions[currentExerciseIndex],
      [field]: value
    };
    setProblemsSolved(solutions);
    // setAssignmentData({ ...assignmentData, exercises: updatedExercises });
  }

  const goTo = (index) => {
    if (index >= 0 && index < exercises.length) {
      setCurrentExerciseIndex(index);
    }
  };

  //-------Tracking progress---------

  const progress = useMemo(() => {
    if (!problemsSolved.length) return 0;

    const solvedCount = problemsSolved.filter(p => {
      if (p.exerciseType === "text") {
        return p.solution && p.solution.trim() !== "";
      }

      if (p.exerciseType === "mcq") {
        // at least one question answered
        return p.mcqAnswers.some(a => a.selected.length > 0);
      }

      if (p.exerciseType === "file") {
        return p.fileUrl && p.fileUrl !== "";
      }

      return false;
    }).length;

    return Math.round((solvedCount / problemsSolved.length) * 100);
 
  }, [problemsSolved]);

  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' });
  const [submittedWithSuccess, setSubmittedWithSuccess] = useState(false);

  const triggerToast = (message, subMessage = 'Just now') => {
    setToast({ visible: true, message, subMessage });
  };

  const buildFormData = () => {
    const formData = new FormData();
    // strip localFile out before JSON-serializing
    const serializeable = problemsSolved.map(({ localFile, ...rest }) => rest);
    formData.append("problemsSolved", JSON.stringify(serializeable));

    problemsSolved.forEach((p, i) => {
      if (p.localFile) {
        const renamed = new File([p.localFile], `${i}_${p.localFile.name}`, { type: p.localFile.type });
        formData.append("solutionFiles", renamed);
      }
    });

    return formData;
  }

  const handleSubmit = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/solutions/${id}/submit`,
        buildFormData()
      );
      setShowModal(false);
      triggerToast("Solution Sent", "Your solution has been sent to teacher.");
    } catch (error) {
      console.error("Error submitting:", error);
      triggerToast("Error", "Failed to submit your answer.");
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/solutions/${id}/draft`,
        buildFormData()
      );
      triggerToast("Draft saved", "Your current progress has been saved as a draft.");
    } catch (error) {
      console.error("Error saving draft:", error);
      triggerToast("Error", "Failed to save draft.");
    }
  };

  //--------------TOOLS-------------

  const [showCalculator, setShowCalculator] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false)

  // for the mcq:

  const toggleMCQOption = (questionId, optionText, allowMultiple) => {
    const solutions = [...problemsSolved];
    const current = solutions[currentExerciseIndex];
    const mcqAnswers = [...(current.mcqAnswers || [])];
    const answerIdx = mcqAnswers.findIndex(a => a.questionId === questionId);

    if (answerIdx === -1) return;

    let selected = [...mcqAnswers[answerIdx].selected];

    if (allowMultiple) {
      // toggle: add if not there, remove if already selected
      if (selected.includes(optionText)) {
        selected = selected.filter(s => s !== optionText);
      } else {
        selected.push(optionText);
      }
    } else {
      // single answer: replace
      selected = [optionText];
    }

    mcqAnswers[answerIdx] = { ...mcqAnswers[answerIdx], selected };
    solutions[currentExerciseIndex] = { ...current, mcqAnswers };
    setProblemsSolved(solutions);
  };

  return (
    <div className='as-container'>
      <HeaderContent
        title={assignmentData?.title}
        creatorName={`${teacherInfo.givenName} ${teacherInfo.familyName}`}
        commentCount={assignmentData?.commentsCount}
        creationDate={assignmentData?.creationDate}
        saveCount={9}
        ratingAvg={assignmentData?.avgRating}
        handleSubmit={() => setShowModal(true)}
        handleSave={handleSave}
        graded={status === "graded"}
        status={status}
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
                <div
                  type="text"
                  className="lesson-title-input"
                >
                  {exercises?.[currentExerciseIndex]?.title || "Untitled Exercise"}
                </div>
              </div>
              <button
                className="lesson-nav-btn lesson-nav-btn--next"
                disabled={currentExerciseIndex === exercises.length - 1}  // the problem of bonus exercise was due to not setting the boundary (what an idiot that i am)
                onClick={() => {
                  if (currentExerciseIndex >= exercises.length - 1) return;  // ← guard
                  setCurrentExerciseIndex(prev => prev + 1);
                  setProblemsSolved(prev => {
                    const newSolutions = [...prev];
                    if (!newSolutions[currentExerciseIndex + 1]) {
                      newSolutions[currentExerciseIndex + 1] = {
                        exerciseId: exercises[currentExerciseIndex + 1]?._id,
                        solution: "",
                        grade: null,
                        teacherExplination: ""
                      };
                    }
                    return newSolutions;
                  });
                }}
              >
                Next <BackIcon className="lesson-icon rotate-180" />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", paddingLeft: "0.2rem" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>
                Points
              </span>
              <div className="points-box">
                {currentExercise?.exerciseType === "mcq"
                  ? `${(currentExercise.questions || []).reduce((sum, q) => sum + (q.points || 1), 0)} pts`
                  : `${currentExercise?.points || 0} pts`}
              </div>
              {/* Exercise type badge */}
              <div style={{
                padding: "0.2rem 0.7rem", borderRadius: "20px", fontSize: "0.78rem",
                fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                background: currentExercise?.exerciseType === "mcq" ? "#ECFDF5"
                  : currentExercise?.exerciseType === "file" ? "#EFF6FF" : "#FDF2F8",
                color: currentExercise?.exerciseType === "mcq" ? "#10B981"
                  : currentExercise?.exerciseType === "file" ? "#3B82F6" : "#EC4899",
              }}>
                {currentExercise?.exerciseType === "mcq" ? "MCQ"
                  : currentExercise?.exerciseType === "file" ? "File"
                    : "Text"}
              </div>
            </div>

            {/* ── Exercise statement ── */}
            <div className="exercise-statement-box">

              {/* TEXT type — show rich HTML content */}
              {(currentExercise?.exerciseType === "text" || !currentExercise?.exerciseType) && (
                <div className="as-exercise-card">
                  <div className="as-page-number">Exercise {currentExerciseIndex + 1}</div>
                  <div
                    className="as-page-content"
                    dangerouslySetInnerHTML={{ __html: currentExercise?.content }}
                  />
                </div>
              )}

              {/* FILE type — show PDF or image */}
              {currentExercise?.exerciseType === "file" && (
                <div className="as-exercise-card">
                  <div className="as-page-number">Exercise {currentExerciseIndex + 1}</div>
                  {currentExercise?.fileUrl ? (
                    currentExercise.fileUrl.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={`${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${currentExercise.fileUrl}`}
                        title={currentExercise.title}
                        style={{ width: "100%", height: "400px", border: "none", borderRadius: "10px" }}
                      />
                    ) : (
                      <img
                        src={`${process.env.REACT_APP_API_URL_GATEWAY}/${currentExercise.fileUrl}`}
                        alt={currentExercise.title}
                        style={{ width: "100%", borderRadius: "10px", objectFit: "contain" }}
                      />
                    )
                  ) : (
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "#8E8E8E", textAlign: "center" }}>
                      No file attached to this exercise.
                    </p>
                  )}
                </div>
              )}

              {/* MCQ type — show questions with options */}
              {status !== "graded" ?
                (currentExercise?.exerciseType === "mcq" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {(currentExercise.questions || []).map((q, qIdx) => {
                      const currentAnswer = problemsSolved[currentExerciseIndex]?.mcqAnswers?.find(
                        a => a.questionId === q._id
                      );
                      const selected = currentAnswer?.selected || [];

                      return (
                        <div className="as-exercise-card" key={qIdx}>
                          <div className="as-page-number">{q.points || 1} pt{q.points !== 1 ? "s" : ""}</div>
                          <p style={{
                            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
                            fontSize: "0.97rem", color: "#1E293B", marginBottom: "1rem"
                          }}>
                            {qIdx + 1}. {q.questionContent}
                          </p>
                          {q.allowMultiple && (
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "#8E8E8E", marginBottom: "0.8rem" }}>
                              Multiple answers allowed
                            </p>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {(q.options || []).map((opt, oIdx) => {
                              const isSelected = selected.includes(opt.text);
                              return (
                                <div
                                  key={oIdx}
                                  onClick={() => toggleMCQOption(q._id, opt.text, q.allowMultiple)}
                                  className={`mcq-solve-option ${isSelected ? "mcq-solve-option--selected" : ""}`}
                                >
                                  <div className={`mcq-solve-indicator ${q.allowMultiple ? "mcq-solve-indicator--checkbox" : "mcq-solve-indicator--radio"} ${isSelected ? "mcq-solve-indicator--active" : ""}`}>
                                    {isSelected && (
                                      q.allowMultiple ? (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      ) : (
                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
                                      )
                                    )}
                                  </div>
                                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.92rem", color: "#1E293B" }}>
                                    {opt.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )) : (
                  currentExercise?.exerciseType === "mcq" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {(currentExercise.questions || []).map((q, qIdx) => {
                        const studentAnswer = problemsSolved[currentExerciseIndex]?.mcqAnswers?.find(a => a.questionId === q._id);
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
                  )
                )}
            </div>

            {/* Problem content editor */}
            {(currentExercise?.exerciseType === "text" || !currentExercise?.exerciseType) && status !== "graded" && (
              <>


                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", width: "100%", }}>
                  {problemsSolved[currentExerciseIndex]?.localFile || problemsSolved[currentExerciseIndex]?.fileUrl ? (
                    <div style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.8rem 1rem", borderRadius: "12px",
                      border: "1.5px solid #BA68C8", background: "#D8B3E070"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BA68C8" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "#BA68C8", fontWeight: 600 }}>
                          {problemsSolved[currentExerciseIndex]?.localFile?.name || "File uploaded"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCurrentSolution("localFile", null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#BA68C8", fontWeight: 700, fontSize: "0.82rem" }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                      padding: "1.5rem", borderRadius: "12px", border: "2px dashed #A7A7A7",
                      cursor: "pointer", background: "#FAFAFA", transition: "border-color 0.2s", width: "100%"
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#EC4899"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#A7A7A7"}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#8E8E8E" }}>
                        Click to upload a PDF or image
                      </span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) updateCurrentSolution("localFile", file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <JoditEditor
                  key={`content-${currentExerciseIndex}`}
                  value={problemsSolved[currentExerciseIndex]?.solution || ""}
                  onBlur={(val) => updateCurrentSolution("solution", val)}
                  config={{ uploader: { insertImageAsBase64URI: true } }}
                />

              </>
            )}

            {(currentExercise?.exerciseType === "text" || !currentExercise?.exerciseType) && (status === "graded") && (
              <div className="as-exercise-card" style={{ border: "1.5px solid #EC489980", background: "#FDF2F8" }}>
                <div className="as-page-number">Teacher's Remark</div>
                <div
                  className="as-page-content"
                  dangerouslySetInnerHTML={{ __html: problemsSolved[currentExerciseIndex]?.teacherExplanation }}
                />
              </div>
            )}

            {/* FILE → Jodit editor for written answer (student writes explanation alongside the file) */}
            {currentExercise?.exerciseType === "file" && status !== "graded" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#1E293B" }}>
                  Your Answer
                </span>

                {/* File upload */}
                {problemsSolved[currentExerciseIndex]?.localFile || problemsSolved[currentExerciseIndex]?.fileUrl ? (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.8rem 1rem", borderRadius: "12px",
                    border: "1.5px solid #10B98150", background: "#ECFDF5"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "#10B981", fontWeight: 600 }}>
                        {problemsSolved[currentExerciseIndex]?.localFile?.name || "File uploaded"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateCurrentSolution("localFile", null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#10B981", fontWeight: 700, fontSize: "0.82rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                    padding: "1.5rem", borderRadius: "12px", border: "2px dashed #A7A7A7",
                    cursor: "pointer", background: "#FAFAFA", transition: "border-color 0.2s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#EC4899"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#A7A7A7"}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#8E8E8E" }}>
                      Click to upload a PDF or image
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) updateCurrentSolution("localFile", file);
                      }}
                    />
                  </label>
                )}

                {/* Written answer alongside the file */}
                <JoditEditor
                  key={`content-${currentExerciseIndex}`}
                  value={problemsSolved[currentExerciseIndex]?.solution || ""}
                  onBlur={(val) => updateCurrentSolution("solution", val)}
                  config={{ uploader: { insertImageAsBase64URI: true } }}
                />
              </div>
            )}

            {/* MCQ → no answer editor needed, answers are tracked via option clicks */}
            {currentExercise?.exerciseType === "mcq" && (
              <div style={{
                padding: "0.8rem 1rem", borderRadius: "12px",
                background: "#ECFDF5", border: "1.5px solid #10B98130",
                fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem",
                color: "#10B981", fontWeight: 600, textAlign: "center"
              }}>
                {(problemsSolved[currentExerciseIndex]?.mcqAnswers || []).filter(a => a.selected.length > 0).length}
                {" "}/ {(currentExercise.questions || []).length} questions answered
              </div>
            )}
            {/* Solution toggle */}
            {/* <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.9rem 1.2rem", borderRadius: "12px",
              border: `1.5px solid ${currentExercise.hasSolution ? "#EC489980" : "#A7A7A7"}`,
              background: currentExercise.hasSolution ? "#FDF2F8" : "#fff",
              transition: "all 0.25s ease", cursor: "pointer"
            }}
              onClick={() => updateCurrentExercise("hasSolution", !currentExercise.hasSolution)}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1E293B" }}>
                  Solution available
                </span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "#8E8E8E" }}>
                  Add a solution that students can view after submitting
                </span>
              </div>
              <div style={{
                width: "46px", height: "26px", borderRadius: "30px", flexShrink: 0,
                background: currentExercise.hasSolution ? "#EC4899" : "#E2E4E5",
                position: "relative", transition: "background 0.25s ease"
              }}>
                <div style={{
                  position: "absolute", top: "3px",
                  left: currentExercise.hasSolution ? "23px" : "3px",
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: "#fff", transition: "left 0.25s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>
        
            {currentExercise.hasSolution && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <span style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                  fontSize: "1rem", color: "#1E293B", paddingLeft: "0.2rem"
                }}>
                  Solution
                </span>
                <JoditEditor
                  key={`solution-${currentExerciseIndex}`}
                  value={currentExercise.solution || ""}
                  onBlur={(val) => updateCurrentExercise("solution", val)}
                  config={{ uploader: { insertImageAsBase64URI: true } }}
                />
              </div>
            )} */}
            {/* Progress dots + back */}
            <div className="lesson-editor-actions">
              <div className="lesson-editor-actions-right">
                <span className="lesson-dots">
                  {exercises.map((_, i) => (
                    <span
                      key={i}
                      className={`lesson-dot ${i === currentExerciseIndex ? "lesson-dot--active" : ""} ${exercises?.[i]?.content ? "lesson-dot--filled" : ""}`}
                      onClick={() => setCurrentExerciseIndex(i)}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside className="cd-sidebar">

          {/* Course Details */}
          <div className="cd-sidebar-card">
            <div className="cd-sidebar-card-header">
              <h4 className="cd-sidebar-card-title" style={{ textTransform: "capitalize" }}>Assignment Details</h4>
            </div>

            <p className="cd-course-title-text">{assignmentData.title}</p>

            <div className="cd-teacher-row">
              <div className="cd-teacher-avatar" style={{ background: "#EC489922", color: "#EC4899" }}>
                {`${teacherInfo?.familyName?.charAt(0).toUpperCase()}${teacherInfo?.givenName?.charAt(0).toUpperCase()}`}

              </div>
              <div>
                <p className="cd-teacher-label">Instructor</p>
                <p className="cd-teacher-name">Dr. {teacherInfo?.givenName} {teacherInfo?.familyName}</p>
              </div>
            </div>


            <div className="cd-progress-section">
              <div className="cd-progress-label">
                <span>Your progress</span>
                <span className="cd-progress-pct">{progress}%</span>
              </div>
              <div className="cd-progress-track">
                <div className="cd-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="cd-details-grid">
              <div className="cd-detail-item">
                <LessonIcon className="detail-item-icon" />
                <div>
                  <p className="cd-detail-label">Exercises</p>
                  <p className="cd-detail-val">{exercises.length}</p>
                </div>
              </div>
              <div className="cd-detail-item">
                <TimerIcon />
                <div>
                  <p className="cd-detail-label">Duration</p>
                  <p className="cd-detail-val">6h 40min</p>
                </div>
              </div>
              <div className="cd-detail-item">
                <TargetIcon />
                <div>
                  <p className="cd-detail-label">Level</p>
                  <p className="cd-detail-val">{assignmentData.level}</p>
                </div>
              </div>

              <div className="cd-detail-item">
                <DoneIcon />
                <div>
                  <p className="cd-detail-label">Solved</p>
                  <p className="cd-detail-val">3 / 4</p>
                </div>
              </div>
            </div>


            <div className="cd-tags">
              {/* {COURSE.tags.map((tag) => (
                                        <span className="cd-tag" key={tag}>{tag}</span>
                                    ))} */}
              <span className="cd-tag" >{assignmentData?.category?.name}</span>
              <span className="cd-tag" >{assignmentData?.subCategory?.name}</span>
            </div>
          </div>

          <div className="cd-sidebar-card">
            <h4 className="cd-sidebar-card-title">Exercises</h4>
            <div className="cd-lesson-list">
              {exercises.map((e, i) => (
                <button
                  key={e.id}
                  className={`cd-lesson-list-item ${i === currentExerciseIndex ? "cd-lesson-list-item--active" : ""}`}
                  onClick={() => goTo(i)}
                >
                  <span className="cd-lesson-num">
                    {i + 1}
                  </span>
                  <span className="cd-lesson-list-title">{e.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="cd-sidebar-card">
            <h4 className="cd-sidebar-card-title">You may also like</h4>
            <div className="cd-rec-list">
              {RECOMMENDATIONS.map((r) => {
                const lc = LEVEL_COLOR[r.level];
                return (
                  <div className="cd-rec-item" key={r.id}>
                    <div className="cd-rec-thumb" style={{ background: r.thumbBg }}>
                      {r.thumb}
                    </div>
                    <div className="cd-rec-info">
                      <p className="cd-rec-title">{r.title}</p>
                      <p className="cd-rec-desc">{r.desc}</p>
                      <span className="cd-rec-level" style={{ color: lc.color, background: lc.bg }}>
                        {r.level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
        <div className="tool-btns-wrapper">
          <button onClick={(e) => { e.preventDefault(); setShowCodePanel(true) }}>
            <CodeIcon className="tool-icon" />
          </button>
          <button onClick={(e) => { e.preventDefault(); setShowCalculator(true) }} >
            <CalcIcon className="tool-icon" />
          </button>
        </div>
      </div>

      {
        showModal && (
          <SubmitAssignmentConfirm
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onConfirm={handleSubmit}
            assignmentData={assignmentData}
            exercises={exercises}
            problemsSolved={problemsSolved}
          />)
      }

      {
        submittedWithSuccess && (
          <SubmitAssignmentSuccess
            assignmentTitle={assignmentData.title}
            onClose={() => setSubmittedWithSuccess(false)}
          />
        )
      }

      {
        showCalculator &&
        <Calculator onClose={() => setShowCalculator(false)} />
      }

      <CodePanel isOpen={showCodePanel} onClose={() => setShowCodePanel(false)} />

      <ToastMessage
        visible={toast.visible}
        message={toast.message}
        subMessage={toast.subMessage}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div >
  )
}

export default AssignmentSolve
