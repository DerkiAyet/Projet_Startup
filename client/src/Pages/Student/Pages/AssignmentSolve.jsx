import React, { useEffect, useState } from 'react'
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

  useEffect(() => {

    axios.get(`http://localhost:8080/content/assignments/${id}`)
      .then(response => {
        setAssignmentData(response.data.assignment);
        setExercises(response.data.assignment.exercises);
        setTeacherInfo(response.data.teacher);
        setProblemsSolved([{
          exerciseId: response.data.assignment.exercises[0]._id,
          solution: "",
          grade: null,
          teacherExplination: ""
        }]
        )
      })
      .catch(error => {
        console.error("Error fetching assignment data:", error);
      });

  }, [])

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

  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' });
  const [submittedWithSuccess, setSubmittedWithSuccess] = useState(false);

  const triggerToast = (message, subMessage = 'Just now') => {
    setToast({ visible: true, message, subMessage });
  };

  const handleSubmit = async () => {
    try {
      await axios.put(`http://localhost:8080/content/activity/solutions/${id}/submit`, {
        problemsSolved: problemsSolved
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      setShowModal(true)

    } catch (error) {
      console.error("Error saving draft:", error);
      triggerToast("Error", "Failed to submit your answer.");
    }
  }

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:8080/content/activity/solutions/${id}/draft`, {
        problemsSolved: problemsSolved
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      triggerToast("Draft saved", "Your current progress has been saved as a draft.");

    } catch (error) {
      console.error("Error saving draft:", error);
      triggerToast("Error", "Failed to save draft.");
    }
  }

  //--------------TOOLS-------------

  const [showCalculator, setShowCalculator] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false)

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
            {/* Points input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", paddingLeft: "0.2rem" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>
                Points
              </span>
              <div className="points-box">
                {`${currentExercise?.points} pts` || "N/A"}
              </div>
            </div>
            <div className="exercise-statement-box">
              <div className="as-exercise-card">
                <div className="as-page-number">Exercise {currentExerciseIndex + 1}</div>
                <div
                  className="as-page-content"
                  dangerouslySetInnerHTML={{ __html: exercises?.[currentExerciseIndex]?.content }}
                />
              </div>
            </div>
            {/* Problem content editor */}
            <JoditEditor
              key={`content-${currentExerciseIndex}`}
              value={problemsSolved[currentExerciseIndex]?.solution || ""}
              onBlur={(val) => updateCurrentSolution("solution", val)}
              config={{ uploader: { insertImageAsBase64URI: true } }}
            />
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
                <span className="cd-progress-pct">30%</span>
              </div>
              <div className="cd-progress-track">
                <div className="cd-progress-fill" style={{ width: `30%` }} />
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
          <button onClick={(e) => {e.preventDefault(); setShowCodePanel(true)}}>
            <CodeIcon className="tool-icon" />
          </button>
          <button onClick={(e) => {e.preventDefault(); setShowCalculator(true)}} >
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
    </div>
  )
}

export default AssignmentSolve
