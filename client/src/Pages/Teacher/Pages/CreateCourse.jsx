import React, { useState, useRef, useEffect } from 'react'
import '../Styles/CreateCourse.css'
import { ReactComponent as DocumentIcon } from '../../../Assets/icons/CourseIcons/document-icon.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { ReactComponent as PrintIcon } from '../../../Assets/icons/CourseIcons/print-course.svg'
import { ReactComponent as BackIcon } from '../../../Assets/icons/CourseIcons/back-icon.svg'
import JoditEditor from "jodit-react";
import QuizBuilder from '../Components/QuizBuilder'
import PublishSuccessPopup from '../Components/Publishsuccesspopup'
import axios from 'axios'
import PublishQuizSuccessPopup from '../Components/PublishQuizSuccessPopup'
import Loader from '../../../Partials/Components/Loader'

axios.defaults.withCredentials = true;

function CreateCourse() {

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail: null,
    category: { id: 0, subCategory: 0 },
    level: "",
    lessons: [{ title: "", content: "", videoUrl: "", lessonType: "text" }],
  });

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const [step, setStep] = useState(0);

  const thumbnailInputRef = useRef();

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCourseData({
      ...courseData,
      thumbnail: file
    });
  };

  const descriptionRef = useRef(null);

  const handlePlanText = () => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  };

  const [categories, setCategories] = useState([])

  useEffect(() => {

    axios.defaults.withCredentials = true
    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-teacher-expertise`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err.response.data))

  }, [])

  const levels = ["Beginner", "Intermediate", "Advanced"];

  const selectedCategory = categories.find(cat => cat.idSubject === courseData.category.id);
  const availableSubcategories = selectedCategory?.subCategories || [];
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
  });

  const [errorLesson, setErrorLesson] = useState("")

  const handleErrorLesson = () => {
    if (!courseData.lessons[currentLessonIndex].title.trim()) {
      setErrorLesson("You should enter a proper title to the current lesson first");
      return false; // ❗ important
    }
    return true; // valid
  };

  const handleFocus = (fieldName) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: ""
    }));
  }

  const handleNext = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!courseData.title.trim()) {
      newErrors.title = "Please enter the course name.";
    }

    if (!courseData.description.trim()) {
      newErrors.description = "Please enter the course description.";
    }

    if (!courseData.category.id) {
      newErrors.category = "Please select a category.";
    }

    if (!courseData.level) {
      newErrors.level = "Please select a level.";
    }

    // If there are errors → show UI errors, stop function
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({ identifier: "", password: "" });

    setStep(step + 1);

  }

  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [publishedCourseId, setPublishedCourseId] = useState(null)

  const editorRef = useRef(null);

  const allLessonContentsRef = useRef({}); // { [lessonIndex]: content }
  const videoInputRef = useRef(); // for the file picker
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false); // ← new state to handle video processing after upload, before it's ready to use in the lesson

  useEffect(() => {
    if (allLessonContentsRef.current[currentLessonIndex] === undefined) {
      allLessonContentsRef.current[currentLessonIndex] =
        courseData.lessons[currentLessonIndex]?.content || "";
    }
  }, [currentLessonIndex]);

  const handleVideoUpload = async (file) => {
    setUploadingVideo(true);
    setUploadProgress(0);
    setProcessingVideo(false);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/upload-video`,
        formData,
        {
          timeout: 30 * 60 * 1000, // 30 minutes timeout for slow uploads
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
            if (percent === 100) setProcessingVideo(true); // ← server is now streaming to Cloudinary
          },
        }
      );

      const videoUrl = response.data.videoUrl;
      // Cloudinary thumbnail: same URL but replace extension with .jpg
      const thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg");

      allLessonContentsRef.current[currentLessonIndex] = {
        ...allLessonContentsRef.current[currentLessonIndex],
        videoUrl,
        thumbnailUrl,
        lessonType: "video",
        content: "",
      };

      const updatedLessons = [...courseData.lessons];
      updatedLessons[currentLessonIndex] = {
        ...updatedLessons[currentLessonIndex],
        videoUrl,
        thumbnailUrl,
        publicId: response.data.publicId, // for the delete process in backend for video in the cloud *we won't pass it of course when puclishing the course*
        lessonType: "video",
      };
      setCourseData({ ...courseData, lessons: updatedLessons });

    } catch (err) {
      console.error("Video upload failed:", err);
    } finally {
      setUploadingVideo(false);
      setProcessingVideo(false);
    }
  };

  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    const finalLessons = courseData.lessons.map((lesson, i) => {
      const ref = allLessonContentsRef.current[i];
      return {
        title: lesson.title,
        lessonType: lesson.lessonType || "text",
        content: lesson.lessonType === "video"
          ? ""
          : (ref?.content ?? lesson.content ?? ""),
        videoUrl: lesson.lessonType === "video"
          ? (lesson.videoUrl ?? ref?.videoUrl ?? "")
          : "",
      };
    });

    try {
      setLoading(true)
      const formData = new FormData();
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("thumbnail", courseData.thumbnail);
      formData.append("level", courseData.level);
      formData.append("category", JSON.stringify(courseData.category));
      formData.append("lessons", JSON.stringify(finalLessons));
      formData.append("tags", JSON.stringify(courseData.tags ?? []));

      const response = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses`, formData);
      setPublishedCourseId(response.data.course._id);
      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false)
    }
  };

  const [addQuizSucces, setAddQuizSuccess] = useState(false)

  return (
    <div className='create-course-container'>
      <div className="create-course-wrapper">
        {
          step === 0 ? 
            <>
              <div className="create-course-header">
                <h1 className='create-course-title'>Create New Course</h1>
                <p>Build engaging course content with rich media and interactive elements</p>
              </div>
              <form className='create-course-form'>
                <div className="form-group">
                  <span>Course Name</span>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      placeholder="Enter course name"
                      required
                      value={courseData.title}
                      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                      className={errors.title ? 'input-error' : ''}
                      onFocus={() => handleFocus("title")}
                    />
                    {errors.title && <p className="error-text">{errors.title}</p>}
                  </div>
                </div>
                <div className="thumbnail-upload-section">
                  <span>Course Thumbnail</span>

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
                      {courseData.thumbnail ? (
                        <>
                          <img
                            src={URL.createObjectURL(courseData.thumbnail)}
                            alt="thumbnail preview"
                            className="thumbnail-preview"
                          />
                          <button
                            type="button"
                            className="thumb-btn change-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              thumbnailInputRef.current.click();
                            }}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            className="thumb-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseData({ ...courseData, thumbnail: null });
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <div className="thumbnail-placeholder">
                          <p>Click or drop an image here</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={thumbnailInputRef}
                        style={{ display: "none" }}
                        onChange={handleThumbnailChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <span>Course Description</span>
                  <div className="input-wrapper">
                    <textarea
                      id="description"
                      name="description"
                      className={errors.description ? 'input-error' : ''}
                      placeholder="Enter course description"
                      required
                      ref={descriptionRef}
                      value={courseData.description}
                      onChange={() => { handlePlanText(); setCourseData({ ...courseData, description: descriptionRef.current.value }) }}
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
                        required
                        value={courseData.category.id}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          const selected = categories.find(cat => cat.idSubject === newCategory);
                          const hasSubs = selected?.subCategories?.length > 0;

                          setCourseData({
                            ...courseData,
                            category: { ...courseData.category, id: parseInt(newCategory), subCategory: hasSubs ? "" : "" }
                          });
                        }}
                      >
                        <option value="">Category</option>
                        {categories.map(c => <option value={c.idSubject}>{c.name}</option>)}
                      </select>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: "absolute",
                          right: "60px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none"
                        }}
                      >
                        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                      </svg>
                      {errors.category && <p className="error-text">{errors.category}</p>}
                    </div>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <select
                        className="custom-select"
                        disabled={availableSubcategories.length === 0}
                        value={courseData.category.subCategory}
                        onChange={(e) => setCourseData({ ...courseData, category: { ...courseData.category, subCategory: parseInt(e.target.value) } })}
                      >
                        <option value="">Field</option>

                        {availableSubcategories.map((sub) => (
                          <option key={sub.idSub} value={sub.idSub}>{sub.name}</option>
                        ))}
                      </select>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: "absolute",
                          right: "60px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none"
                        }}
                      >
                        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                      </svg>
                    </div>

                    <div style={{ position: "relative", display: "inline-block" }} >
                      <select
                        className={`custom-select ${errors.level ? 'input-error' : ''}`}
                        value={courseData.level}
                        onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
                      >
                        <option>Level</option>
                        {levels.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <svg
                        width="10"
                        height="6"
                        viewBox="0 0 10 6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: "absolute",
                          right: "60px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none"
                        }}
                      >
                        <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                      </svg>
                      {errors.level && <p className="error-text">{errors.level}</p>}
                    </div>

                  </div>
                </div>
                <div className="course-btn-actions">
                  <button className='draft-btn'>Save as Draft</button>
                  <button type="submit" className='create-course-button' onClick={handleNext}>
                    <DocumentIcon />
                    Create Course
                  </button>
                </div>
              </form>
            </> :
            <div className="lesson-editor-container">
              <div className="lesson-editor-header">
                <div className="header-left">
                  <h5>{courseData.title}</h5>
                  <EditIcon />
                </div>
                <div className="header-right">
                  <button className="draft-btn">Save as Draft</button>
                  <button className='submit-btn' onClick={() => handlePublish()}>
                    Publish
                  </button>
                  <button className='print-btn'>
                    Print
                    <PrintIcon />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", marginBottom: "0.8rem" }}>
                <button
                  type="button"
                  className={`lesson-type-btn ${courseData.lessons[currentLessonIndex]?.lessonType !== "video" ? "submit-btn" : ""}`}
                  onClick={() => {
                    const updatedLessons = [...courseData.lessons];
                    updatedLessons[currentLessonIndex].lessonType = "text";
                    setCourseData({ ...courseData, lessons: updatedLessons });
                  }}
                >
                  📝 Text
                </button>
                <button
                  type="button"
                  className={`lesson-type-btn ${courseData.lessons[currentLessonIndex]?.lessonType === "video" ? "submit-btn" : ""}`}
                  onClick={() => {
                    const updatedLessons = [...courseData.lessons];
                    updatedLessons[currentLessonIndex].lessonType = "video";
                    setCourseData({ ...courseData, lessons: updatedLessons });
                  }}
                >
                  🎬 Video
                </button>
              </div>


              <div className="lesson-nav-bar">
                <button
                  className="lesson-nav-btn"
                  disabled={currentLessonIndex === 0}
                  onClick={() => {
                    // Save current content is handled by onBlur in JoditEditor
                    setCurrentLessonIndex(prev => prev - 1);
                  }}
                >
                  <BackIcon className="lesson-icon" />
                  Previous
                </button>

                <div className="lesson-nav-info">
                  <span className="lesson-counter">
                    Lesson {currentLessonIndex + 1} of {courseData.lessons.length}
                  </span>
                  <input
                    type="text"
                    className="lesson-title-input"
                    placeholder={`Lesson ${currentLessonIndex + 1} title...`}
                    value={courseData.lessons[currentLessonIndex]?.title || ""}
                    onChange={(e) => {
                      const updatedLessons = [...courseData.lessons];
                      updatedLessons[currentLessonIndex] = {
                        ...updatedLessons[currentLessonIndex],
                        title: e.target.value,
                      };
                      setCourseData({ ...courseData, lessons: updatedLessons });
                    }}
                    onFocus={() => setErrorLesson("")}
                  />
                  {errorLesson && <p className="error-text">{errorLesson}</p>}
                </div>

                <button
                  className="lesson-nav-btn lesson-nav-btn--next"
                  onClick={() => {
                    if (!handleErrorLesson()) return; // stop everything when the title is not written
                    // saveCurrentLesson();
                    const updatedLessons = [...courseData.lessons];
                    // If we're on the last lesson, add a new one
                    if (currentLessonIndex === courseData.lessons.length - 1) {
                      updatedLessons.push({ title: "", content: "" });
                      setCourseData({ ...courseData, lessons: updatedLessons });
                    }

                    setCurrentLessonIndex(prev => prev + 1);
                  }}
                >
                  {currentLessonIndex === courseData.lessons.length - 1 ? (
                    "+ New Lesson"
                  ) : (
                    <>
                      Next <BackIcon className="lesson-icon rotate-180" />
                    </>
                  )}
                </button>
              </div>

              {/* Conditional: Jodit or Video uploader */}
              {courseData.lessons[currentLessonIndex]?.lessonType === "video" ? (
                <div className="video-upload-zone">
                  {courseData.lessons[currentLessonIndex]?.videoUrl ? (
                    <div className="video-uploaded-preview">
                      <img
                        src={courseData.lessons[currentLessonIndex].thumbnailUrl}
                        alt="video thumbnail"
                        className="video-thumbnail"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {/* Floating action buttons top right */}
                      <div className="video-float-actions">
                        <button
                          type="button"
                          className="video-float-btn"
                          title="Change video"
                          onClick={() => videoInputRef.current.click()}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="video-float-btn video-float-btn--delete"
                          title="Delete video"
                          onClick={async () => {
                            const publicId = courseData.lessons[currentLessonIndex].publicId;
                            if (publicId) {
                              try {
                                await axios.delete(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/video/${encodeURIComponent(publicId)}`);
                              } catch (err) {
                                console.error("Failed to delete from Cloudinary:", err);
                              }
                            }
                            const updatedLessons = [...courseData.lessons];
                            updatedLessons[currentLessonIndex].videoUrl = "";
                            updatedLessons[currentLessonIndex].thumbnailUrl = "";
                            updatedLessons[currentLessonIndex].publicId = "";
                            setCourseData({ ...courseData, lessons: updatedLessons });
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                      {/* Info badge bottom left */}
                      <div className="video-info-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <div className="video-info-text">
                          <span className="video-info-title">Video ready</span>
                          <span className="video-info-sub">Cloudinary · Ready to publish</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        ref={videoInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // delete old video first
                            const oldPublicId = courseData.lessons[currentLessonIndex].publicId;
                            if (oldPublicId) {
                              axios.delete(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/video/${encodeURIComponent(oldPublicId)}`).catch(console.error);
                            }
                            handleVideoUpload(file);
                          }
                        }}
                      />
                    </div>

                  ) : uploadingVideo ? (
                    <div className="video-uploading">
                      <span className="video-uploading-label">
                        {processingVideo ? "Processing on Cloudinary..." : `Uploading... ${uploadProgress}%`}
                      </span>
                      <div className="video-progress-track">
                        <div
                          className={`video-progress-bar ${processingVideo ? "video-progress-bar--processing" : ""}`}
                          style={{ width: processingVideo ? "100%" : `${uploadProgress}%` }}
                        />
                      </div>
                      {processingVideo && (
                        <span className="video-uploading-sub">This may take a moment for large videos...</span>
                      )}
                    </div>

                  ) : (
                    <div className="video-pick">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M10 9l5 3-5 3V9z" fill="#A7A7A7" stroke="none" />
                      </svg>
                      <span className="video-pick-label">Click to select a video file</span>
                      <button
                        type="button"
                        className="submit-btn"
                        style={{ padding: "0.5rem 1.5rem", borderRadius: "30px", border: "none", background: "var(--main-color-light)", color: "white", fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
                        onClick={() => videoInputRef.current.click()}
                      >
                        Select Video
                      </button>
                      <input
                        type="file"
                        accept="video/*"
                        ref={videoInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleVideoUpload(file);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (<JoditEditor
                key={currentLessonIndex}
                ref={editorRef}
                value={courseData.lessons[currentLessonIndex]?.content || ""}
                onChange={(newContent) => {
                  allLessonContentsRef.current[currentLessonIndex] = {
                    ...allLessonContentsRef.current[currentLessonIndex],
                    content: newContent,
                    lessonType: "text",
                    videoUrl: "",
                  };
                }}
                config={{
                  uploader: { insertImageAsBase64URI: true },
                  clipboard: { processPasteHTML: true, processPasteFromWord: true },
                  toolbarAdaptive: false
                }}
              />)}

              <div className="lesson-editor-actions">
                <div className="lesson-editor-actions-right">
                  <span className="lesson-dots">
                    {courseData.lessons.map((_, i) => (
                      <span
                        key={i}
                        className={`lesson-dot ${i === currentLessonIndex ? "lesson-dot--active" : ""} ${courseData.lessons[i].content ? "lesson-dot--filled" : ""}`}
                        onClick={() => { setCurrentLessonIndex(i) }}
                      />
                    ))}
                  </span>
                </div>
              </div>
              <button className="draft-btn lesson-back-btn" onClick={() => setStep(0)}>
                <BackIcon /> Back
              </button>
            </div>

        }
      </div>

      {
        loading &&
        <Loader />
      }

      {
        showSuccessPopup && (
          <PublishSuccessPopup
            title={courseData.title}
            type={"course"}
            onClose={() => setShowSuccessPopup(false)}
            onAddQuiz={() => {
              setShowSuccessPopup(false)
              setShowQuizBuilder(true)
            }}
          />
        )
      }

      {
        showQuizBuilder && (
          <QuizBuilder
            courseId={publishedCourseId}
            onClose={() => setShowQuizBuilder(false)}
            onPublish={async (quizPayload) => {
              try {
                setLoading(true)
                const response = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses/${publishedCourseId}/quiz`, quizPayload)
                console.log('Quiz payload:', response.data)
                setShowQuizBuilder(false)
                setAddQuizSuccess(true)
              } catch (error) {
                console.error("error while publishing quiz", error)
              } finally {
                setLoading(false)
              }
            }}
          />
        )
      }

      {
        addQuizSucces &&
        <PublishQuizSuccessPopup
          courseName={courseData.title}
          onClose={() => setAddQuizSuccess(false)}
          courseId={publishedCourseId} />
      }
    </div >
  )
}


export default CreateCourse
