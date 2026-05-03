import React, { useState, useRef, useEffect } from "react";
import "../Styles/CourseDisplay.css";
import '../../Home/Styles/PostPage.css'
import { useParams, useSearchParams } from "react-router-dom";
// import ReactStars from "react-rating-stars-component";
import { ReactComponent as TargetIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg'
import { ReactComponent as TimerIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg';
import { ReactComponent as DoneIcon } from '../../../Assets/icons/CourseIcons/done-icon.svg'
import { ReactComponent as LessonIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg';
// import { ReactComponent as FullStar } from '../../../Assets/icons/CourseIcons/full-star.svg';
import { ReactComponent as FullHeartIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg'
import { ReactComponent as LikeIcon } from '../../../Assets/icons/TimelineIcons/like-post.svg'
// import { ReactComponent as SharIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg';
import HeaderContent from "../Components/HeaderContent";
import { CourseView } from "../Components/CourseView";
import TipView from "../Components/TipView";
import { AssignementView } from "../Components/AssignementView";
import { useTranslation } from "react-i18next";
import axios from 'axios'
import { useContext } from "react";
import { AppContext } from "../../../App";
import QuizSolve from "../../Student/Components/QuizSolve";
import QuizViewer from "../Components/QuizViewer";

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

export const CommentLine = ({ courseId, commentId, commentTxt, commentUserName, commentUserImg, replies = [], commentUserFamily, commentUserGiven, commentBody = { likes: [], replies: [], _id: 0, userId: 0, text: "" }, userId, toggleLike, contentType }) => {

    const { t } = useTranslation()

    const [isExpanded, setIsExpanded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyClicked, setReplyClicked] = useState(false);
    const [commentReplies, setCommentReplies] = useState(replies)
    const [reply, setReply] = useState('');
    const [isLiked, setIsLiked] = useState(() => {
        if (!commentBody || !commentBody.likes || !Array.isArray(commentBody.likes)) {
            return false;
        }
        return commentBody.likes.some((l) => l.userId === userId);
    });
    const maxLength = 150;

    const toggleReadMore = () => setIsExpanded(!isExpanded);

    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        return text.split(urlRegex).map((part, index) =>
            urlRegex.test(part) ? (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#007bff" }}
                >
                    {part}
                </a>
            ) : (
                part
            )
        );
    }

    function formatTextWithLineBreaks(text) {
        return text.split("\n").map((line, index) => (
            <React.Fragment key={index}>
                {linkify(line)}
                <br />
            </React.Fragment>
        ));
    }

    const addReply = async (e) => {
        e.preventDefault();
        const link = contentType === "course" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses` : contentType === "assignment" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`

        try {
            const res = await axios.post(
                `${link}/${courseId}/comment/${commentId}/reply`,
                { text: `@${commentUserName} ${reply}` },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const newReply = {
                userId: res.data.userId,
                text: `@${commentUserName} ${reply}`,
                userName: commentUserName,
                familyName: commentUserFamily,
                givenName: commentUserGiven,
                userImg: commentUserImg
            };

            // setPosts((prev) =>
            //     prev.map((p) =>
            //         p._id === postId
            //             ? {
            //                 ...p,
            //                 comments: p.comments.map((c) =>
            //                     c._id === commentId
            //                         ? { ...c, replies: [...c.replies, newReply] }
            //                         : c
            //                 ),
            //                 commentsCount: p.commentsCount + 1
            //             }
            //             : p
            //     )
            // );

            // onAddReply?.(newReply, commentId);

            setCommentReplies([...commentReplies, newReply]);

            setReplyClicked(false);

            setReply('')

        } catch (err) {
            console.error(err?.response?.data || err);
        }
    };

    const toggleLikeReply = (replyId, setLiked) => {

        const link = contentType === "course" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses` : contentType === "assignment" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`

        axios.post(`${link}/${courseId}/comment/${commentId}/reply/${replyId}/like`, {},
            { headers: { "Content-Type": "application/json" } })
            .then((res) => {
                const updatedComment = res.data.comments.find(c => c._id === commentId);
                const updatedReply = updatedComment?.replies.find(r => r._id === replyId);
                const nowLiked = updatedReply?.likes.some(l => l.userId === userId) ?? false;

                setCommentReplies((prev) =>
                    prev.map((r) => r._id === replyId ? updatedReply : r)
                );

                setLiked(nowLiked); // ✅ truth from server
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className="comment-line">
            <div className="comment-user-img" style={{ flexShrink: 0 }}>
                {
                    commentUserImg ?
                        <img src={commentUserImg || '/default_picture.jpeg'} alt="comment user" /> :
                        <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                            {commentUserFamily?.charAt(0).toUpperCase()}
                            {commentUserGiven?.charAt(0).toUpperCase()}
                        </div>
                }
            </div>
            <div className="comment-content">
                <span className="comment-username">{commentUserName}</span>
                <span className="comment-txt" style={{ fontWeight: '350' }}>
                    {commentTxt.length > maxLength && !isExpanded
                        ? `${commentTxt.substring(0, maxLength)}...`
                        : formatTextWithLineBreaks(commentTxt)}
                    {commentTxt.length > maxLength && (
                        <span className="read-more" onClick={toggleReadMore}>
                            {isExpanded ? ` ${t('posts.readLess')}` : ` ${t('posts.readMore')}`}
                        </span>
                    )}
                </span>

                {/* ── Like + View replies row ── */}
                <div className="comment-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {commentReplies.length > 0 && (
                        <span
                            className="view-replies"
                            onClick={() => setShowReplies(!showReplies)}
                            style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span style={{ display: 'inline-block', width: '24px', borderTop: '1px solid #aaa' }} />
                            {showReplies ? t('posts.hideReplies') : `${t('posts.viewReplies')} (${commentReplies.length})`}
                        </span>
                    )}
                    <span
                        className="view-replies"
                        style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setReplyClicked(!replyClicked)}
                    >
                        {t('posts.reply')}
                    </span>
                </div>

                {/* ── Replies ── */}
                {showReplies && (
                    <div className="replies-container" style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid var(--color-border-tertiary)', width: "100%" }}>
                        {commentReplies.map((reply) => (
                            <CommentLine
                                key={reply._id}
                                postId={commentId}
                                commentId={commentId}
                                commentTxt={reply.text}
                                commentUserName={reply.userName}
                                commentUserImg={reply.userImg}
                                commentUserFamily={reply.familyName}
                                commentUserGiven={reply.givenName}
                                replies={[]}
                                userId={userId}
                                commentBody={reply}
                                toggleLike={(replyId, setLiked) => toggleLikeReply(replyId, setLiked)}
                            />
                        ))}
                    </div>
                )}

                {
                    replyClicked && (
                        <div className="add-reply-container">
                            <textarea
                                type="text"
                                placeholder={t('posts.writeReply')}
                                className="add-reply-input"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                            />
                            <button className="post-reply-btn" onClick={addReply} style={{ cursor: "pointer" }}>{t('posts.post')}</button>
                        </div>
                    )
                }
            </div>

            {/* ── Heart icon (right side) ── */}
            {
                isLiked ?
                    <FullHeartIcon className="comment-icon" style={{ flexShrink: 0 }} onClick={() => toggleLike(commentBody._id, (nowLiked) => setIsLiked(nowLiked))} /> :
                    <LikeIcon className="comment-icon" style={{ flexShrink: 0 }} onClick={() => toggleLike(commentBody._id, (nowLiked) => setIsLiked(nowLiked))} />
            }
        </div>
    );
};

// ── Component ────────────────────────────────────────────
export default function CourseDisplay() {

    const { userAuth } = useContext(AppContext)

    const { id } = useParams();
    const [searchParams] = useSearchParams();

    const type = searchParams.get("type");
    // "course" | "assignment" | "tip"

    const [topic, setTopic] = useState(null)
    const [content, setContent] = useState(null)
    const [comments, setComments] = useState(topic?.comments);
    const [teacherId, setTeacherId] = useState(null)

    useEffect(() => {
        const link = type === "course" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses` : type === "assignment" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`;
        axios.get(`${link}/${id}`)
            .then((res) => {
                setTopic(res.data);
                const content = res.data.course ?? res.data.assignment ?? res.data.topic
                setComments(res.data.comments)
                setContent(content)
                setTeacherId(res.data.teacher.userId)
                console.log(res.data)
            })
            .catch((err) => console.error(err.response.data))
    }, [id, type])

    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [doneLessons, setDoneLessons] = useState(new Set());
    const [commentInput, setCommentInput] = useState("");
    const viewerRef = useRef(null);

    const initializeDone = (data) => setDoneLessons(data)

    const onChangeDone = (value) => setDoneLessons(value)

    const goTo = (idx) => {
        setCurrentLessonIdx(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const sendComment = async () => {
        if (!commentInput.trim()) return;

        axios.defaults.withCredentials = true
        const link = type === "course" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses` : type === "assignment" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`

        try {

            const res = await axios.post(`${link}/${id}/comment`,
                { text: commentInput },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            )

            const newComment = {
                userId: res.data.userId,
                text: commentInput,
                userName: userAuth.userName,
                familyName: userAuth.familyName,
                givenName: userAuth.givenName,
                userImg: userAuth.userImg
            };

            setComments([...comments, newComment])
            setCommentInput("");
        } catch (error) {
            console.error(error.response.data)
        }
    };

    const toggleLikeComment = (commentId, setLiked) => {
        const link = type === "course" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/courses` : type === "assignment" ? `${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments/` : `${process.env.REACT_APP_API_URL_GATEWAY}/content/tips`
        axios
            .post(`${link}/${id}/comment/${commentId}/like`, {},
                { headers: { "Content-Type": "application/json" } })
            .then((res) => {
                const updatedComment = res.data.comments.find(c => c._id === commentId);
                const nowLiked = updatedComment?.likes.some(l => l.userId === userAuth.userId) ?? false;

                setComments((prev) => ({
                    ...prev,
                    comments: prev.comments.map((c) =>
                        c._id === commentId ? updatedComment : c
                    )
                }));

                setLiked(nowLiked); // pass the actual value
            })
            .catch((err) => console.error(err));
    };

    // const toggleLike = (id) => {
    //     setLikedComments((prev) => {
    //         const next = new Set(prev);
    //         next.has(id) ? next.delete(id) : next.add(id);
    //         return next;
    //     });
    // };

    const [completionPct, setCompletionPct] = useState(0)

    const handleChangePct = (doneLessonsCount) => {
        setCompletionPct(Math.round((doneLessonsCount / content?.lessons.length) * 100))
    }

    const dateOnly = content?.createdAt
        ? new Date(content.createdAt).toLocaleDateString()
        : null;

    // for the quiz:
    const [attemptId, setAttemptId] = useState(null)
    const [quizData, setQuizData] = useState({})
    const [savedAnswers, setSavedAnswers] = useState({})
    const [showQuizSolve, setShowQuizSolve] = useState(false)
    const [completedResult, setCompletedResult] = useState(null) // to hold the result of a completed quiz for display in QuizSolve


    const handleSaveQuiz = async (answers) => {
        await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/quiz-attempts/${attemptId}/save`, { answers: answers }, {
            headers: { 'Content-Type': 'application/json' }
        })
        setShowQuizSolve(false)
    }

    const handleOpenQuiz = async (quiz) => {
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/quiz-attempts/start`, { quizId: quiz._id }, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const { attempt, resumed, solved } = res.data

            // Convert saved answers array back to the {} object format QuizSolve uses
            let savedAnswers = {}
            if ((resumed || solved) && attempt.answers?.length > 0) {
                attempt.answers.forEach(a => {
                    savedAnswers[a.questionId] = a.responses
                })
            }

            if (solved) setCompletedResult(attempt) // if already solved, we have the result immediately to show in QuizSolve

            setAttemptId(attempt._id)
            setQuizData(quiz)
            setSavedAnswers(savedAnswers)
            setShowQuizSolve(true)
        } catch (err) {
            console.error('Failed to start quiz:', err)
        }
    }

    const handleSubmitQuiz = async (answers) => {
        const response = await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/content/activity/quiz-attempts/${attemptId}/submit`, { answers: answers }, {
            headers: { 'Content-Type': 'application/json' }
        })

        return response.data; // return the result to QuizSolve for display
    }

    //-----------Quiz Viewer for teachers---------

    const [openViewer, setOpenViewer] = useState(false);
    const [openEditBuilder, setOpenEditBuilder] = useState(false);

    return (
        <div className="course-display-container">
            <HeaderContent
                title={content?.title}
                creatorName={`${topic?.teacher.givenName} ${topic?.teacher.familyName}`}
                commentCount={content?.commentsCount}
                creationDate={dateOnly}
                saveCount={9}
                ratingAvg={content?.avgRating}
            />
            <div className="cd-page">
                {/* ── Main area ── */}
                <div className="cd-main">

                    {type === "course" && topic?.course?.lessons && (
                        <CourseView
                            LESSONS={topic.course.lessons}
                            viewerRef={viewerRef}
                            handleChangePct={handleChangePct}
                            courseId={topic.course._id}
                            onChangeDone={onChangeDone}
                            onChangeLesson={(idx) => setCurrentLessonIdx(idx)}
                            initializeDone={initializeDone}
                            quiz={topic.course.quiz}
                            handleShowQuiz={handleOpenQuiz}
                            openQuizViewer={() => setOpenViewer(true)}
                        />
                    )}
                    {type === "tip" && topic?.content && <TipView content={topic.content} />}
                    {type === "assignment" &&
                        <AssignementView PROBLEMATIQUES={topic?.assignment?.exercises || []} viewerRef={viewerRef} assignmentId={topic?.assignment?._id} />
                    }

                    {/* Comments */}
                    <div className="cd-comments">
                        <h3 className="cd-comments-title">
                            Discussion
                            <span className="cd-comments-count">{comments?.length}</span>
                        </h3>

                        {/* Input */}
                        <div className="cd-comment-input-row">
                            <div className="cd-comment-avatar" style={{ background: "#EC489922", color: "#EC4899" }}>ME</div>
                            <div className="cd-comment-input-wrap">
                                <textarea
                                    className="cd-comment-textarea"
                                    placeholder="Share a thought or ask a question..."
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                                    rows={2}
                                />
                                <button className="cd-comment-send-btn" onClick={sendComment} disabled={!commentInput.trim()}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Thread */}
                        <div className="cd-comment-list">
                            <div className="cd-comment-list course-comments-container">
                                {comments?.map((comment) => (
                                    <CommentLine
                                        key={comment._id}
                                        commentId={comment._id}
                                        commentBody={comment}   // ← add this
                                        courseId={id}
                                        contentType={type}
                                        userId={userAuth?.userId}
                                        commentTxt={comment.text || ''}
                                        commentUserName={comment.userName}
                                        commentUserFamily={comment.familyName}
                                        commentUserGiven={comment.givenName}
                                        commentUserImg={comment.userImg}
                                        replies={comment.replies || []}
                                        toggleLike={toggleLikeComment}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <aside className="cd-sidebar">

                    {/* Course Details */}
                    <div className="cd-sidebar-card">
                        <div className="cd-sidebar-card-header">
                            <h4 className="cd-sidebar-card-title" style={{ textTransform: "capitalize" }}>{type} Details</h4>
                        </div>

                        <p className="cd-course-title-text">{content?.title}</p>

                        <div className="cd-teacher-row">
                            <div className="cd-teacher-avatar" style={{ background: "#EC489922", color: "#EC4899" }}>
                                {`${topic?.teacher.familyName.charAt(0).toUpperCase()}${topic?.teacher.givenName.charAt(0).toUpperCase()}`}

                            </div>
                            <div>
                                <p className="cd-teacher-label">Instructor</p>
                                <p className="cd-teacher-name">Dr. {topic?.teacher.givenName} {topic?.teacher.familyName}</p>
                            </div>
                        </div>

                        {/* Progress */}
                        {
                            userAuth.role === "student" && type === "course" &&
                            <div className="cd-progress-section">
                                <div className="cd-progress-label">
                                    <span>Your progress</span>
                                    <span className="cd-progress-pct">{completionPct}%</span>
                                </div>
                                <div className="cd-progress-track">
                                    <div className="cd-progress-fill" style={{ width: `${completionPct}%` }} />
                                </div>
                            </div>
                        }

                        {
                            type !== "tip" &&
                            <div className="cd-details-grid">
                                <div className="cd-detail-item">
                                    <LessonIcon className="detail-item-icon" />
                                    <div>
                                        <p className="cd-detail-label">{type === "course" ? "Lessons" : "Exercises"}</p>
                                        <p className="cd-detail-val">{type === "course" ? content?.lessons?.length : content?.exercises?.length}</p>
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
                                        <p className="cd-detail-val">{content?.level}</p>
                                    </div>
                                </div>
                                {
                                    userAuth.role === "student" && type === "course" &&
                                    <div className="cd-detail-item">
                                        <DoneIcon />
                                        <div>
                                            <p className="cd-detail-label">Completed</p>
                                            <p className="cd-detail-val">{doneLessons.size} / {content?.lessons.length}</p>
                                        </div>
                                    </div>
                                }
                            </div>
                        }

                        <div className="cd-tags">
                            {/* {COURSE.tags.map((tag) => (
                                <span className="cd-tag" key={tag}>{tag}</span>
                            ))} */}
                            <span className="cd-tag" >{content?.category.name}</span>
                            <span className="cd-tag" >{content?.subCategory?.name}</span>
                        </div>
                    </div>

                    {/* Lesson list */}
                    {
                        type === "course" &&
                        <div className="cd-sidebar-card">
                            <h4 className="cd-sidebar-card-title">{type === "course" ? "Lessons" : "Exercises"}</h4>
                            <div className="cd-lesson-list">
                                {content?.lessons?.map((l, i) => (
                                    <button
                                        key={l.id}
                                        className={`cd-lesson-list-item ${i === currentLessonIdx ? "cd-lesson-list-item--active" : ""} ${doneLessons.has(l.id) ? "cd-lesson-list-item--done" : ""}`}
                                        onClick={() => goTo(i)}
                                    >
                                        <span className="cd-lesson-num">
                                            {doneLessons.has(l.id) ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : i + 1}
                                        </span>
                                        <span className="cd-lesson-list-title">{l.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    }

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
            </div>

            {
                userAuth.role === "student" && type === "course" && topic?.course?.quiz && showQuizSolve &&
                <QuizSolve
                    quiz={quizData}
                    attemptId={attemptId}
                    initialAnswers={savedAnswers}
                    onClose={() => setShowQuizSolve(false)}
                    onSave={handleSaveQuiz}
                    onSubmit={handleSubmitQuiz}
                    completedResult={completedResult}
                />
            }

            {
                userAuth.role !== "student" && type === "course" && topic?.course?.quiz && openViewer &&
                <QuizViewer
                    quiz={topic.course.quiz}
                    teacherId={teacherId}
                    onClose={() => setOpenViewer(false)}
                    onEdit={() => { setOpenViewer(false); setOpenEditBuilder(true); }}
                />
            }
        </div>
    );
}