import React, { useState, useRef, useEffect } from 'react'
import '../Styles/CreateCourse.css'
import '../Styles/CreateAssignment.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as PrintIcon } from '../../../Assets/icons/CourseIcons/print-course.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import { ReactComponent as QuestionIcon } from '../../../Assets/icons/CourseIcons/question.svg'
import { ReactComponent as UploadIcon } from '../../../Assets/icons/CourseIcons/upload-file.svg'
import JoditEditor from "jodit-react"
import PublishSuccessPopup from '../Components/Publishsuccesspopup'
import axios from 'axios'
import Loader from '../../../Partials/Components/Loader'

axios.defaults.withCredentials = true;

const newMCQQuestion = () => ({
  questionContent: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
  explanation: "",
  points: 1,
  allowMultiple: false,
});

function CreateAssignment() {

  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    thumbnail: null,
    category: { id: 0, subCategory: 0 },
    level: "",
    exercises: [{
      title: "Exercise 1",
      exerciseType: "text",
      content: "",
      solution: "",
      points: 1,
      hasSolution: false,
      questions: [],
      localFile: null,
      fileUrl: "",
    }],
  });

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [step, setStep] = useState(0);
  const thumbnailInputRef = useRef();
  const fileInputRef = useRef();
  const descriptionRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({ title: "", description: "", category: "", level: "" });
  const [errorExercise, setErrorExercise] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [idPublishedAssignment, setPublishedId] = useState(0);
  const allExerciseContentsRef = useRef({});

  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-teacher-expertise`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err.response.data));
  }, []);

  useEffect(() => {
    if (allExerciseContentsRef.current[currentExerciseIndex] === undefined) {
      allExerciseContentsRef.current[currentExerciseIndex] = {
        content: assignmentData.exercises[currentExerciseIndex]?.content || "",
        solution: assignmentData.exercises[currentExerciseIndex]?.solution || "",
      };
    }
  }, [currentExerciseIndex]);

  const selectedCategory = categories.find(cat => cat.idSubject === assignmentData.category.id);
  const availableSubcategories = selectedCategory?.subCategories || [];
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const currentExercise = assignmentData.exercises[currentExerciseIndex];

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAssignmentData({ ...assignmentData, thumbnail: file });
  };

  const handlePlanText = () => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  };

  const handleFocus = (fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: "" }));
  };

  const handleErrorExercise = () => {
    if (!assignmentData.exercises[currentExerciseIndex].title.trim()) {
      setErrorExercise("Please enter a title for the current exercise first.");
      return false;
    }
    return true;
  };

  const updateCurrentExercise = (field, value) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex] = { ...updated[currentExerciseIndex], [field]: value };
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  // ── MCQ helpers ──────────────────────────────────────
  const addQuestion = () => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions = [
      ...(updated[currentExerciseIndex].questions || []),
      newMCQQuestion()
    ];
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const updateQuestion = (qIdx, field, value) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions[qIdx] = {
      ...updated[currentExerciseIndex].questions[qIdx],
      [field]: value
    };
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const deleteQuestion = (qIdx) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions = updated[currentExerciseIndex].questions.filter((_, i) => i !== qIdx);
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const addOption = (qIdx) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions[qIdx].options.push({ text: "", isCorrect: false });
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions[qIdx].options[oIdx] = {
      ...updated[currentExerciseIndex].questions[qIdx].options[oIdx],
      [field]: value
    };
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const deleteOption = (qIdx, oIdx) => {
    const updated = [...assignmentData.exercises];
    updated[currentExerciseIndex].questions[qIdx].options =
      updated[currentExerciseIndex].questions[qIdx].options.filter((_, i) => i !== oIdx);
    setAssignmentData({ ...assignmentData, exercises: updated });
  };

  const handleNext = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!assignmentData.title.trim()) newErrors.title = "Please enter the assignment name.";
    if (!assignmentData.description.trim()) newErrors.description = "Please enter the assignment description.";
    if (!assignmentData.category.id) newErrors.category = "Please select a category.";
    if (!assignmentData.level) newErrors.level = "Please select a level.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({ title: "", description: "", category: "", level: "" });
    setStep(1);
  };

  const [loading, setLaoding] = useState(false)

  const handlePublish = async () => {
    try {
      setLaoding(true)
      const formData = new FormData();
      formData.append("title", assignmentData.title);
      formData.append("description", assignmentData.description);
      formData.append("thumbnail", assignmentData.thumbnail);
      formData.append("level", assignmentData.level);
      formData.append("category", JSON.stringify(assignmentData.category));
      formData.append("tags", JSON.stringify(assignmentData.tags ?? []));

      const exercisesToSend = assignmentData.exercises.map(({ hasSolution, localFile, ...rest }, i) => ({
        ...rest,
        content: rest.exerciseType === 'text'
          ? (allExerciseContentsRef.current[i]?.content ?? rest.content ?? "")
          : "",
        solution: rest.exerciseType === 'text'
          ? (allExerciseContentsRef.current[i]?.solution ?? rest.solution ?? "")
          : "",
      }));

      formData.append("exercises", JSON.stringify(exercisesToSend));

      // append exercise files with index prefix
      assignmentData.exercises.forEach((ex, i) => {
        if (ex.exerciseType === 'file' && ex.localFile) {
          const renamedFile = new File([ex.localFile], `${i}_${ex.localFile.name}`, { type: ex.localFile.type });
          formData.append('exerciseFiles', renamedFile);
        }
      });

      const response = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments`, formData);
      setPublishedId(response.data.assignment._id);
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLaoding(false)
    }
  };

  const chevronSvg = (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", right: "60px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
      <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
    </svg>
  );

  // to solve the problem of navigate back to the exercice of type text, well since we're using refs the actual exercie in the assignments isn't updated only when we publish the assignment
  const handleNavigateExercise = (newIndex) => {
    // Save current exercise content from ref to state before navigating
    const updated = [...assignmentData.exercises];
    if (updated[currentExerciseIndex].exerciseType === 'text') {
      updated[currentExerciseIndex] = {
        ...updated[currentExerciseIndex],
        content: allExerciseContentsRef.current[currentExerciseIndex]?.content ?? updated[currentExerciseIndex].content,
        solution: allExerciseContentsRef.current[currentExerciseIndex]?.solution ?? updated[currentExerciseIndex].solution,
      };
      setAssignmentData({ ...assignmentData, exercises: updated });
    }
    setCurrentExerciseIndex(newIndex);
  };

  return (
    <div className='create-course-container'>
      <div className="create-course-wrapper">

        {step === 0 ? (
          <>
            <div className="create-course-header">
              <h1 className='create-course-title'>Create New Assignment</h1>
              <p>Build exercises with optional solutions for your students</p>
            </div>
            <form className='create-course-form'>
              <div className="form-group">
                <span>Assignment Name</span>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter assignment name"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                    className={errors.title ? 'input-error' : ''}
                    onFocus={() => handleFocus("title")}
                  />
                  {errors.title && <p className="error-text">{errors.title}</p>}
                </div>
              </div>

              <div className="thumbnail-upload-section">
                <span>Assignment Thumbnail</span>
                <div className="drop-zone-wrapper">
                  <div
                    className="thumbnail-dropzone"
                    onClick={() => thumbnailInputRef.current.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleThumbnailChange({ target: { files: [file] } });
                    }}
                  >
                    {assignmentData.thumbnail ? (
                      <>
                        <img src={URL.createObjectURL(assignmentData.thumbnail)} alt="thumbnail preview" className="thumbnail-preview" />
                        <button type="button" className="thumb-btn change-btn" onClick={(e) => { e.stopPropagation(); thumbnailInputRef.current.click(); }}>Change</button>
                        <button type="button" className="thumb-btn delete-btn" onClick={(e) => { e.stopPropagation(); setAssignmentData({ ...assignmentData, thumbnail: null }); }}>Delete</button>
                      </>
                    ) : (
                      <div className="thumbnail-placeholder"><p>Click or drop an image here</p></div>
                    )}
                    <input type="file" accept="image/*" ref={thumbnailInputRef} style={{ display: "none" }} onChange={handleThumbnailChange} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <span>Assignment Description</span>
                <div className="input-wrapper">
                  <textarea
                    placeholder="Enter assignment description"
                    className={errors.description ? 'input-error' : ''}
                    ref={descriptionRef}
                    value={assignmentData.description}
                    onChange={() => { handlePlanText(); setAssignmentData({ ...assignmentData, description: descriptionRef.current.value }); }}
                    onFocus={() => handleFocus("description")}
                  />
                  {errors.description && <p className="error-text">{errors.description}</p>}
                </div>
              </div>

              <div className="select-flex">
                <div className="select-flex-line">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <select
                      className={`custom-select ${errors.category ? 'input-error' : ''}`}
                      value={assignmentData.category.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignmentData({ ...assignmentData, category: { id: parseInt(val), subCategory: "" } });
                      }}
                    >
                      <option value="">Category</option>
                      {categories.map(c => <option key={c.idSubject} value={c.idSubject}>{c.name}</option>)}
                    </select>
                    {chevronSvg}
                    {errors.category && <p className="error-text">{errors.category}</p>}
                  </div>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <select
                      className="custom-select"
                      disabled={availableSubcategories.length === 0}
                      value={assignmentData.category.subCategory}
                      onChange={(e) => setAssignmentData({ ...assignmentData, category: { ...assignmentData.category, subCategory: parseInt(e.target.value) } })}
                    >
                      <option value="">Field</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub.idSub} value={sub.idSub}>{sub.name}</option>
                      ))}
                    </select>
                    {chevronSvg}
                  </div>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <select
                      className={`custom-select ${errors.level ? 'input-error' : ''}`}
                      value={assignmentData.level}
                      onChange={(e) => setAssignmentData({ ...assignmentData, level: e.target.value })}
                    >
                      <option value="">Level</option>
                      {levels.map(l => <option key={l}>{l}</option>)}
                    </select>
                    {chevronSvg}
                    {errors.level && <p className="error-text">{errors.level}</p>}
                  </div>
                </div>
              </div>

              <div className="course-btn-actions">
                <button className='draft-btn'>Save as Draft</button>
                <button type="submit" className='create-course-button' onClick={handleNext}>
                  <DocumentIcon />
                  Create Assignment
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="lesson-editor-container">
            <div className="lesson-editor-header">
              <div className="header-left">
                <h5>{assignmentData.title}</h5>
                <EditIcon />
              </div>
              <div className="header-right">
                <button className="draft-btn">Save as Draft</button>
                <button className='submit-btn' onClick={handlePublish}>Publish</button>
                <button className='print-btn'>Print <PrintIcon /></button>
              </div>
            </div>

            {/* ── Exercise type toggle ── */}
            <div className="exercise-type-toggle">
              {["text", "mcq", "file"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`exercise-type-btn ${currentExercise.exerciseType === type ? "exercise-type-btn--active" : ""}`}
                  onClick={() => updateCurrentExercise("exerciseType", type)}
                >
                  {type === "text" && <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}> <EditIcon /> Text</span>}
                  {type === "mcq" && <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}> <QuestionIcon /> MCQ</span>}
                  {type === "file" && <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}> <UploadIcon /> File</span>}
                </button>
              ))}
            </div>

            {/* ── Nav bar ── */}
            <div className="lesson-nav-bar">
              <button
                className="lesson-nav-btn"
                disabled={currentExerciseIndex === 0}
                onClick={() => handleNavigateExercise(currentExerciseIndex - 1)}
              >
                <BackIcon className="lesson-icon" />
                Previous
              </button>
              <div className="lesson-nav-info">
                <span className="lesson-counter">
                  Exercise {currentExerciseIndex + 1} of {assignmentData.exercises.length}
                </span>
                <input
                  type="text"
                  className="lesson-title-input"
                  placeholder={`Exercise ${currentExerciseIndex + 1} title...`}
                  value={currentExercise.title || ""}
                  onChange={(e) => updateCurrentExercise("title", e.target.value)}
                  onFocus={() => setErrorExercise("")}
                />
                {errorExercise && <p className="error-text">{errorExercise}</p>}
              </div>
              <button
                className="lesson-nav-btn lesson-nav-btn--next"
                onClick={() => {
                  if (!handleErrorExercise()) return;

                  if (currentExerciseIndex === assignmentData.exercises.length - 1) {
                    // Save current content to state first
                    const updated = [...assignmentData.exercises];
                    if (updated[currentExerciseIndex].exerciseType === 'text') {
                      updated[currentExerciseIndex] = {
                        ...updated[currentExerciseIndex],
                        content: allExerciseContentsRef.current[currentExerciseIndex]?.content ?? updated[currentExerciseIndex].content,
                        solution: allExerciseContentsRef.current[currentExerciseIndex]?.solution ?? updated[currentExerciseIndex].solution,
                      };
                    }
                    // Add new exercise
                    updated.push({
                      title: `Exercise ${updated.length + 1}`,
                      exerciseType: "text",
                      content: "", solution: "", points: 1,
                      hasSolution: false, questions: [],
                      localFile: null, fileUrl: ""
                    });
                    setAssignmentData({ ...assignmentData, exercises: updated });
                    setCurrentExerciseIndex(currentExerciseIndex + 1); // direct, not handleNavigateExercise
                  } else {
                    handleNavigateExercise(currentExerciseIndex + 1); // normal navigation
                  }
                }}
              >
                {currentExerciseIndex === assignmentData.exercises.length - 1
                  ? "+ New Exercise"
                  : <> Next <BackIcon className="lesson-icon rotate-180" /></>}
              </button>
            </div>

            {/* ── Points (shown for text and file, not mcq since each question has its own points) ── */}
            {currentExercise.exerciseType !== "mcq" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", paddingLeft: "0.2rem" }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>Points</span>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  placeholder="0"
                  value={currentExercise.points || ""}
                  onChange={(e) => updateCurrentExercise("points", parseFloat(e.target.value) || 1)}
                  style={{
                    width: "80px", padding: "0.4rem 0.7rem", borderRadius: "10px",
                    border: "1.5px solid #A7A7A7", fontSize: "0.9rem", outline: "none",
                    fontFamily: "'Nunito', sans-serif"
                  }}
                />
              </div>
            )}

            {/* ── TEXT type ── */}
            {currentExercise.exerciseType === "text" && (
              <>
                <JoditEditor
                  key={`content-${currentExerciseIndex}`}
                  value={currentExercise.content || ""}
                  onChange={(val) => {
                    allExerciseContentsRef.current[currentExerciseIndex] = {
                      ...allExerciseContentsRef.current[currentExerciseIndex],
                      content: val,
                    };
                  }}
                  config={{ uploader: { insertImageAsBase64URI: true }, toolbarAdaptive: false }}
                />

                {/* Solution toggle */}
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.9rem 1.2rem", borderRadius: "12px",
                    border: `1.5px solid ${currentExercise.hasSolution ? "#EC489980" : "#A7A7A7"}`,
                    background: currentExercise.hasSolution ? "#FDF2F8" : "#fff",
                    transition: "all 0.25s ease", cursor: "pointer"
                  }}
                  onClick={() => updateCurrentExercise("hasSolution", !currentExercise.hasSolution)}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1E293B" }}>Solution available</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "#8E8E8E" }}>Add a solution students can view after submitting</span>
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
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1E293B", paddingLeft: "0.2rem" }}>Solution</span>
                    <JoditEditor
                      key={`solution-${currentExerciseIndex}`}
                      value={currentExercise.solution || ""}
                      onChange={(val) => {
                        allExerciseContentsRef.current[currentExerciseIndex] = {
                          ...allExerciseContentsRef.current[currentExerciseIndex],
                          solution: val,
                        };
                      }}
                      config={{ uploader: { insertImageAsBase64URI: true }, toolbarAdaptive: false }}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── FILE type ── */}
            {currentExercise.exerciseType === "file" && (
              <div className="file-upload-zone">
                {currentExercise.localFile ? (
                  // ── File selected — show info ──
                  <div className="file-uploaded-preview">
                    <div className="file-uploaded-info">
                      <div className="file-uploaded-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="file-uploaded-name">{currentExercise.localFile.name}</p>
                        <p className="file-uploaded-size">
                          {(currentExercise.localFile.size / 1024 / 1024).toFixed(2)} MB
                          · {currentExercise.localFile.name.split('.').pop().toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="file-upload-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => updateCurrentExercise("localFile", null)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── No file yet — show picker ──
                  <div className="file-upload-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span className="file-upload-label">Click to upload a PDF or image</span>
                    <button
                      type="button"
                      className="file-upload-btn"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Select File
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) updateCurrentExercise("localFile", file);
                  }}
                />
              </div>
            )}

            {/* ── MCQ type ── */}
            {currentExercise.exerciseType === "mcq" && (
              <div className="mcq-builder">
                {(currentExercise.questions || []).map((q, qIdx) => (
                  <div key={qIdx} className="mcq-question-card">
                    <div className="mcq-question-header">
                      <span className="mcq-question-label">Question {qIdx + 1}</span>
                      <button type="button" className="mcq-delete-btn" onClick={() => deleteQuestion(qIdx)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <input
                      type="text"
                      className="mcq-question-input"
                      placeholder="Enter your question..."
                      value={q.questionContent}
                      onChange={(e) => updateQuestion(qIdx, "questionContent", e.target.value)}
                    />

                    <div className="mcq-options-list">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="mcq-option-row">
                          <input
                            type={q.allowMultiple ? "checkbox" : "radio"}
                            className="mcq-correct-checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              if (!q.allowMultiple) {
                                // single answer: uncheck all others first
                                const updated = [...assignmentData.exercises];
                                updated[currentExerciseIndex].questions[qIdx].options =
                                  updated[currentExerciseIndex].questions[qIdx].options.map((o, i) => ({
                                    ...o, isCorrect: i === oIdx
                                  }));
                                setAssignmentData({ ...assignmentData, exercises: updated });
                              } else {
                                updateOption(qIdx, oIdx, "isCorrect", e.target.checked);
                              }
                            }}
                          />
                          <input
                            type="text"
                            className="mcq-option-input"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, oIdx, "text", e.target.value)}
                          />
                          <button
                            type="button"
                            className="mcq-option-delete"
                            onClick={() => deleteOption(qIdx, oIdx)}
                            disabled={q.options.length <= 2}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="mcq-option-add" onClick={() => addOption(qIdx)}>
                      + Add option
                    </button>

                    <div className="mcq-question-footer">
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "#1E293B", fontWeight: 600 }}>Points:</span>
                      <input
                        type="number"
                        min={0.25}
                        step={0.25}
                        className="mcq-points-input"
                        value={q.points}
                        onChange={(e) => updateQuestion(qIdx, "points", parseFloat(e.target.value) || 1)}
                      />
                      <label className="mcq-allow-multiple">
                        <input
                          type="checkbox"
                          checked={q.allowMultiple}
                          onChange={(e) => updateQuestion(qIdx, "allowMultiple", e.target.checked)}
                          style={{ accentColor: "var(--main-color)" }}
                        />
                        Allow multiple correct answers
                      </label>
                    </div>

                    <input
                      type="text"
                      className="mcq-question-input"
                      placeholder="Explanation (optional)..."
                      value={q.explanation || ""}
                      onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                      style={{ marginTop: "0.2rem" }}
                    />
                  </div>
                ))}

                <button type="button" className="mcq-add-question-btn" onClick={addQuestion}>
                  + Add Question
                </button>
              </div>
            )}

            {/* ── Progress dots + back ── */}
            <div className="lesson-editor-actions">
              <div className="lesson-editor-actions-right">
                <span className="lesson-dots">
                  {assignmentData.exercises.map((_, i) => (
                    <span
                      key={i}
                      className={`lesson-dot ${i === currentExerciseIndex ? "lesson-dot--active" : ""} ${assignmentData.exercises[i].content || assignmentData.exercises[i].questions?.length > 0 || assignmentData.exercises[i].localFile ? "lesson-dot--filled" : ""}`}
                      onClick={() => handleNavigateExercise(i)}
                    />
                  ))}
                </span>
              </div>
            </div>

            <button className="draft-btn lesson-back-btn" onClick={() => setStep(0)}>
              <BackIcon /> Back
            </button>
          </div>
        )}
      </div>

      {
        loading && <Loader />
      }

      {showSuccessPopup && (
        <PublishSuccessPopup
          courseName={assignmentData.title}
          type={"assignment"}
          onClose={() => setShowSuccessPopup(false)}
          id={idPublishedAssignment}
        />
      )}
    </div>
  );
}

export default CreateAssignment;