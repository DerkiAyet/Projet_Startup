import React, { useState, useRef, useEffect } from 'react'
import '../Styles/CreateCourse.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as PrintIcon } from '../../../Assets/icons/CourseIcons/print-course.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import JoditEditor from "jodit-react"
import PublishSuccessPopup from '../Components/Publishsuccesspopup'
import axios from 'axios'

function CreateAssignment() {

  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    thumbnail: null,
    category: { id: 0, subCategory: 0 },
    level: "",
    exercises: [{ title: "exercise 1", content: "", solution: "", points: 0, hasSolution: false }],
  });

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [step, setStep] = useState(0);
  const thumbnailInputRef = useRef();
  const descriptionRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({ title: "", description: "", category: "", level: "" });
  const [errorExercise, setErrorExercise] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.get('http://localhost:8080/auth/infos/get-subjects')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err.response.data));
  }, []);

  const selectedCategory = categories.find(cat => cat.idSubject === assignmentData.category.id);
  const availableSubcategories = selectedCategory?.subCategories || [];
  const levels = ["Beginner", "Intermediate", "Advanced"];

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

  const [idPublishedAssignment, setPublishedId] = useState(0)

  const handlePublish = async () => {
    try {
      const formData = new FormData();
      formData.append("title", assignmentData.title);
      formData.append("description", assignmentData.description);
      formData.append("thumbnail", assignmentData.thumbnail);
      formData.append("level", assignmentData.level);
      formData.append("category", JSON.stringify(assignmentData.category));
      formData.append("tags", JSON.stringify(assignmentData.tags ?? []));

      // Strip the local-only hasSolution flag before sending
      const exercisesToSend = assignmentData.exercises.map(({ hasSolution, ...rest }) => rest);
      formData.append("exercises", JSON.stringify(exercisesToSend));

      const response = await axios.post('http://localhost:8080/content/assignments', formData);
      setPublishedId(response.data.assignment._id)
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
    }
  };

  const currentExercise = assignmentData.exercises[currentExerciseIndex];

  const chevronSvg = (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", right: "60px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
      <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
    </svg>
  );

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
              {/* Title */}
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

              {/* Thumbnail */}
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

              {/* Description */}
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

              {/* Selects */}
              <div className="select-flex">
                <div className="select-flex-line">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <select
                      className={`custom-select ${errors.category ? 'input-error' : ''}`}
                      value={assignmentData.category.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const selected = categories.find(cat => cat.idSubject === val);
                        const hasSubs = selected?.subCategories?.length > 0;
                        setAssignmentData({ ...assignmentData, category: { id: parseInt(val), subCategory: hasSubs ? "" : "" } });
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
          // ── Step 1: Exercise Editor ──────────────────────────────────────
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
                  const updated = [...assignmentData.exercises];
                  if (currentExerciseIndex === assignmentData.exercises.length - 1) {
                    updated.push({ title: `Exercise ${currentExerciseIndex + 1}`, content: "", solution: "", points: 0, hasSolution: false });
                    setAssignmentData({ ...assignmentData, exercises: updated });
                  }
                  setCurrentExerciseIndex(prev => prev + 1);
                }}
              >
                {currentExerciseIndex === assignmentData.exercises.length - 1 ? "+ New Exercise" : <>Next <BackIcon className="lesson-icon rotate-180" /></>}
              </button>
            </div>

            {/* Points input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", paddingLeft: "0.2rem" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>
                Points
              </span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={currentExercise.points || ""}
                onChange={(e) => updateCurrentExercise("points", parseInt(e.target.value) || 0)}
                style={{
                  width: "80px", padding: "0.4rem 0.7rem", borderRadius: "10px",
                  border: "1.5px solid #A7A7A7", fontSize: "0.9rem", outline: "none",
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </div>

            {/* Problem content editor */}
            <JoditEditor
              key={`content-${currentExerciseIndex}`}
              value={currentExercise.content || ""}
              onBlur={(val) => updateCurrentExercise("content", val)}
              config={{ uploader: { insertImageAsBase64URI: true } }}
            />

            {/* Solution toggle */}
            <div style={{
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

              {/* Toggle switch */}
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

            {/* Solution editor — only shown when toggle is ON */}
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
            )}

            {/* Progress dots + back */}
            <div className="lesson-editor-actions">
              <div className="lesson-editor-actions-right">
                <span className="lesson-dots">
                  {assignmentData.exercises.map((_, i) => (
                    <span
                      key={i}
                      className={`lesson-dot ${i === currentExerciseIndex ? "lesson-dot--active" : ""} ${assignmentData.exercises[i].content ? "lesson-dot--filled" : ""}`}
                      onClick={() => setCurrentExerciseIndex(i)}
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