import { useState, useRef, useEffect } from "react";
import { CommentLine } from "../../Home/Components/PostPage";
import "../Styles/CourseDisplay.css";
import { useParams, useSearchParams, Link } from "react-router-dom";
// import ReactStars from "react-rating-stars-component";
import { ReactComponent as CalendarIcon } from '../../../Assets/icons/NavIcons/calendar.svg';
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg';
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg';
import { ReactComponent as AuthorIcon } from '../../../Assets/icons/CourseIcons/profile-course.svg';
// import { ReactComponent as PeopleIcon } from '../../../Assets/icons/CourseIcons/people-course.svg'
// import { ReactComponent as EmptyStar } from '../../../Assets/icons/CourseIcons/empty-star.svg';
// import { ReactComponent as HalfStar } from '../../../Assets/icons/CourseIcons/half-star.svg'
// import { ReactComponent as FullStar } from '../../../Assets/icons/CourseIcons/full-star.svg';
import { ReactComponent as SharIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg';
import HeaderContent from "../Components/HeaderContent";
import { CourseView } from "../Components/CourseView";
import TipView from "../Components/TipView";
import { AssignementView } from "../Components/AssignementView";

// ── Mock Data ────────────────────────────────────────────
const COURSE = {
    title: "Introduction to Calculus",
    teacher: { name: "Dr. Amina Kerboua", avatar: "AK", color: "#EC4899" },
    completion: 35,
    lessonCount: 12,
    estimatedTime: "6h 40min",
    difficulty: "Intermediate",
    tags: ["Mathematics", "Calculus", "Algebra"],
};

const TIP = {
    title: "How to do better in exam",
    teacher: { name: "Dr. Amina Kerboua", avatar: "AK", color: "#EC4899" },
    viewd: 35,
    tags: ["Mathematics", "Calculus", "Algebra"],
    content: `  <h2>1.1 — Introduction to Limits</h2>
          <p>A <strong>limit</strong> describes the value that a function approaches as the input approaches some value. Limits are the foundation of calculus and are used to define derivatives and integrals.</p>
          <p>Consider the function:</p>
          <div class="math-block">f(x) = (x² − 1) / (x − 1)</div>
          <p>This function is undefined at <em>x = 1</em>, yet as x gets closer and closer to 1 from either side, the function approaches the value <strong>2</strong>. We write:</p>
          <div class="math-block">lim<sub>x→1</sub> f(x) = 2</div>
          <p>This is the core idea behind a limit — it is about <em>approaching</em>, not reaching.</p>
          <h2>1.2 — One-Sided Limits</h2>
          <p>Sometimes a function approaches different values depending on which direction we approach from. These are called <strong>one-sided limits</strong>.</p>
          <ul>
            <li><strong>Left-hand limit:</strong> lim<sub>x→a⁻</sub> f(x) — approaching from the left</li>
            <li><strong>Right-hand limit:</strong> lim<sub>x→a⁺</sub> f(x) — approaching from the right</li>
          </ul>
    `,
    avgRating: 4.2,
    numComments: 12
}

const LESSONS = [
    {
        id: 1,
        title: "What is a Limit?",
        content: `
          <h2>1.1 — Introduction to Limits</h2>
          <p>A <strong>limit</strong> describes the value that a function approaches as the input approaches some value. Limits are the foundation of calculus and are used to define derivatives and integrals.</p>
          <p>Consider the function:</p>
          <div class="math-block">f(x) = (x² − 1) / (x − 1)</div>
          <p>This function is undefined at <em>x = 1</em>, yet as x gets closer and closer to 1 from either side, the function approaches the value <strong>2</strong>. We write:</p>
          <div class="math-block">lim<sub>x→1</sub> f(x) = 2</div>
          <p>This is the core idea behind a limit — it is about <em>approaching</em>, not reaching.</p>
          <h2>1.2 — One-Sided Limits</h2>
          <p>Sometimes a function approaches different values depending on which direction we approach from. These are called <strong>one-sided limits</strong>.</p>
          <ul>
            <li><strong>Left-hand limit:</strong> lim<sub>x→a⁻</sub> f(x) — approaching from the left</li>
            <li><strong>Right-hand limit:</strong> lim<sub>x→a⁺</sub> f(x) — approaching from the right</li>
          </ul>
          <p>A limit exists at a point <em>a</em> if and only if both one-sided limits exist and are equal:</p>
          <div class="math-block">lim<sub>x→a⁻</sub> f(x) = lim<sub>x→a⁺</sub> f(x) = L</div>
          <p>If they differ, we say the limit <em>does not exist</em> at that point.</p>

          <h2>1.1 — Introduction to Limits</h2>
          <p>A <strong>limit</strong> describes the value that a function approaches as the input approaches some value. Limits are the foundation of calculus and are used to define derivatives and integrals.</p>
          <p>Consider the function:</p>
          <div class="math-block">f(x) = (x² − 1) / (x − 1)</div>
          <p>This function is undefined at <em>x = 1</em>, yet as x gets closer and closer to 1 from either side, the function approaches the value <strong>2</strong>. We write:</p>
          <div class="math-block">lim<sub>x→1</sub> f(x) = 2</div>
          <p>This is the core idea behind a limit — it is about <em>approaching</em>, not reaching.</p>
          <h2>1.2 — One-Sided Limits</h2>
          <p>Sometimes a function approaches different values depending on which direction we approach from. These are called <strong>one-sided limits</strong>.</p>
          <ul>
            <li><strong>Left-hand limit:</strong> lim<sub>x→a⁻</sub> f(x) — approaching from the left</li>
            <li><strong>Right-hand limit:</strong> lim<sub>x→a⁺</sub> f(x) — approaching from the right</li>
          </ul>
          <p>A limit exists at a point <em>a</em> if and only if both one-sided limits exist and are equal:</p>
          <div class="math-block">lim<sub>x→a⁻</sub> f(x) = lim<sub>x→a⁺</sub> f(x) = L</div>
          <p>If they differ, we say the limit <em>does not exist</em> at that point.</p>
          <h2>1.1 — Introduction to Limits</h2>
          <p>A <strong>limit</strong> describes the value that a function approaches as the input approaches some value. Limits are the foundation of calculus and are used to define derivatives and integrals.</p>
          <p>Consider the function:</p>
          <div class="math-block">f(x) = (x² − 1) / (x − 1)</div>
          <p>This function is undefined at <em>x = 1</em>, yet as x gets closer and closer to 1 from either side, the function approaches the value <strong>2</strong>. We write:</p>
          <div class="math-block">lim<sub>x→1</sub> f(x) = 2</div>
          <p>This is the core idea behind a limit — it is about <em>approaching</em>, not reaching.</p>
          <h2>1.2 — One-Sided Limits</h2>
          <p>Sometimes a function approaches different values depending on which direction we approach from. These are called <strong>one-sided limits</strong>.</p>
          <ul>
            <li><strong>Left-hand limit:</strong> lim<sub>x→a⁻</sub> f(x) — approaching from the left</li>
            <li><strong>Right-hand limit:</strong> lim<sub>x→a⁺</sub> f(x) — approaching from the right</li>
          </ul>
          <p>A limit exists at a point <em>a</em> if and only if both one-sided limits exist and are equal:</p>
          <div class="math-block">lim<sub>x→a⁻</sub> f(x) = lim<sub>x→a⁺</sub> f(x) = L</div>
          <p>If they differ, we say the limit <em>does not exist</em> at that point.</p>
          <h2>1.1 — Introduction to Limits</h2>
          <p>A <strong>limit</strong> describes the value that a function approaches as the input approaches some value. Limits are the foundation of calculus and are used to define derivatives and integrals.</p>
          <p>Consider the function:</p>
          <div class="math-block">f(x) = (x² − 1) / (x − 1)</div>
          <p>This function is undefined at <em>x = 1</em>, yet as x gets closer and closer to 1 from either side, the function approaches the value <strong>2</strong>. We write:</p>
          <div class="math-block">lim<sub>x→1</sub> f(x) = 2</div>
          <p>This is the core idea behind a limit — it is about <em>approaching</em>, not reaching.</p>
          <h2>1.2 — One-Sided Limits</h2>
          <p>Sometimes a function approaches different values depending on which direction we approach from. These are called <strong>one-sided limits</strong>.</p>
          <ul>
            <li><strong>Left-hand limit:</strong> lim<sub>x→a⁻</sub> f(x) — approaching from the left</li>
            <li><strong>Right-hand limit:</strong> lim<sub>x→a⁺</sub> f(x) — approaching from the right</li>
          </ul>
          <p>A limit exists at a point <em>a</em> if and only if both one-sided limits exist and are equal:</p>
          <div class="math-block">lim<sub>x→a⁻</sub> f(x) = lim<sub>x→a⁺</sub> f(x) = L</div>
          <p>If they differ, we say the limit <em>does not exist</em> at that point.</p>
        `,

    },
    {
        id: 2,
        title: "Continuity",
        content: `
          <h2>2.1 — Defining Continuity</h2>
          <p>A function f is <strong>continuous</strong> at a point a if three conditions hold:</p>
          <ul>
            <li>f(a) is defined</li>
            <li>lim<sub>x→a</sub> f(x) exists</li>
            <li>lim<sub>x→a</sub> f(x) = f(a)</li>
          </ul>
          <p>Intuitively, a continuous function can be drawn without lifting the pen from the paper.</p>
          <div class="math-block">f is continuous at a ⟺ lim<sub>x→a</sub> f(x) = f(a)</div>
        `,
    },
    {
        id: 3,
        title: "The Derivative",
        content: `
          <h2>3.1 — Definition of the Derivative</h2>
          <p>The <strong>derivative</strong> of a function f at a point a is defined as:</p>
          <div class="math-block">f′(a) = lim<sub>h→0</sub> [f(a+h) − f(a)] / h</div>
          <p>This represents the instantaneous rate of change of f at the point a — or geometrically, the slope of the tangent line to the curve at that point.</p>
          <p>If this limit exists, we say f is <em>differentiable</em> at a.</p>
        `,
    },
];

const COMMENTS = [
    {
        id: 1,
        avatar: "SA",
        color: "#8B5CF6",
        name: "Sara Amrani",
        time: "2 hours ago",
        text: "This explanation of one-sided limits is so clear! I finally get it. Thank you Dr. Kerboua 🙏",
        likes: 4,
    },
    {
        id: 2,
        avatar: "YB",
        color: "#0EA5E9",
        name: "Yacine Benali",
        time: "5 hours ago",
        text: "Could you add a visual graph showing the approach from both sides? It would really help understand the concept intuitively.",
        likes: 7,
    },
    {
        id: 3,
        avatar: "LM",
        color: "#10B981",
        name: "Lina Merabet",
        time: "1 day ago",
        text: "The math notation is perfectly formatted. I love how each page focuses on one idea at a time.",
        likes: 2,
    },
];

const mockComments = [
    {
        commentId: 1,
        commentText: 'Wow, looks amazing! 😍',
        User: { userName: 'alex_99', userImg: "https://i.pravatar.cc/60?img=1" },
        replies: [
            { replyId: 1, replyText: 'Right?! 😄', User: { userName: 'jane_smith', userImg: null } },
        ],
    },
    {
        commentId: 2,
        commentText: 'I need to visit this place someday. Where exactly is this? The scenery looks unreal, especially with that lighting.',
        User: { userName: 'travel.with.sara', userImg: "https://i.pravatar.cc/60?img=1" },
    },
    {
        commentId: 3,
        commentText: 'Great shot! 📸',
        User: { userName: 'photo_mike', userImg: "https://i.pravatar.cc/60?img=1" },
    },
];

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

// ── Component ────────────────────────────────────────────
export default function CourseDisplay() {

    const { id } = useParams();
    const [searchParams] = useSearchParams();

    const type = searchParams.get("type");
    // "course" | "assignment" | "tip"

    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [doneLessons, setDoneLessons] = useState(new Set());
    const [comments, setComments] = useState(COMMENTS);
    const [commentInput, setCommentInput] = useState("");
    const [likedComments, setLikedComments] = useState(new Set());
    const viewerRef = useRef(null);

    const lesson = LESSONS[currentLessonIdx];
    const isDone = doneLessons.has(lesson.id);

    const goTo = (idx) => {
        setCurrentLessonIdx(idx);
        viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleDone = () => {
        setDoneLessons((prev) => {
            const next = new Set(prev);
            next.has(lesson.id) ? next.delete(lesson.id) : next.add(lesson.id);
            return next;
        });
    };

    const sendComment = () => {
        const text = commentInput.trim();
        if (!text) return;
        setComments((prev) => [
            {
                id: Date.now(),
                avatar: "ME",
                color: "#EC4899",
                name: "You",
                time: "Just now",
                text,
                likes: 0,
            },
            ...prev,
        ]);
        setCommentInput("");
    };

    const toggleLike = (id) => {
        setLikedComments((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const [completionPct, setCompletionPct] = useState(0)

    const handleChangePct = (doneLessonsCount) => {
        setCompletionPct(Math.round((doneLessonsCount / LESSONS.length) * 100))
    }

    // const completionPct = Math.round((doneLessons.size / LESSONS.length) * 100);

    return (
        <div className="course-display-container">
            <HeaderContent
                title={COURSE.title}
                creatorName={COURSE.teacher.name}
                commentCount={3}
                creationDate={"2024-03-23"}
                saveCount={9}
                ratingAvg={4.3}
            />
            <div className="cd-page">
                {/* ── Main area ── */}
                <div className="cd-main">

                    {type === "course" && <CourseView LESSONS={LESSONS} viewerRef={viewerRef} handleChangePct={handleChangePct} />}
                    {type === "tip" && <TipView content={TIP.content} />}
                    {type === "assignment" && <AssignementView PROBLEMATIQUES={LESSONS} viewerRef={viewerRef} />}


                    {/* Comments */}
                    <div className="cd-comments">
                        <h3 className="cd-comments-title">
                            Discussion
                            <span className="cd-comments-count">{mockComments.length}</span>
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
                                {mockComments.map((comment) => (
                                    <CommentLine
                                        key={comment.commentId}
                                        commentTxt={comment.commentText || ''}
                                        commentUserName={comment.userName}
                                        commentUserImg={comment.userImg}
                                        replies={comment.replies || []}
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
                            <h4 className="cd-sidebar-card-title">Course Details</h4>
                        </div>

                        <p className="cd-course-title-text">{COURSE.title}</p>

                        <div className="cd-teacher-row">
                            <div className="cd-teacher-avatar" style={{ background: COURSE.teacher.color + "22", color: COURSE.teacher.color }}>
                                {COURSE.teacher.avatar}
                            </div>
                            <div>
                                <p className="cd-teacher-label">Instructor</p>
                                <p className="cd-teacher-name">{COURSE.teacher.name}</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="cd-progress-section">
                            <div className="cd-progress-label">
                                <span>Your progress</span>
                                <span className="cd-progress-pct">{completionPct}%</span>
                            </div>
                            <div className="cd-progress-track">
                                <div className="cd-progress-fill" style={{ width: `${completionPct}%` }} />
                            </div>
                        </div>

                        <div className="cd-details-grid">
                            <div className="cd-detail-item">
                                <span className="cd-detail-icon">📚</span>
                                <div>
                                    <p className="cd-detail-label">Lessons</p>
                                    <p className="cd-detail-val">{COURSE.lessonCount}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <span className="cd-detail-icon">⏱️</span>
                                <div>
                                    <p className="cd-detail-label">Duration</p>
                                    <p className="cd-detail-val">{COURSE.estimatedTime}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <span className="cd-detail-icon">🎯</span>
                                <div>
                                    <p className="cd-detail-label">Level</p>
                                    <p className="cd-detail-val">{COURSE.difficulty}</p>
                                </div>
                            </div>
                            <div className="cd-detail-item">
                                <span className="cd-detail-icon">✅</span>
                                <div>
                                    <p className="cd-detail-label">Completed</p>
                                    <p className="cd-detail-val">{doneLessons.size} / {LESSONS.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="cd-tags">
                            {COURSE.tags.map((tag) => (
                                <span className="cd-tag" key={tag}>{tag}</span>
                            ))}
                        </div>
                    </div>

                    {/* Lesson list */}
                    <div className="cd-sidebar-card">
                        <h4 className="cd-sidebar-card-title">Lessons</h4>
                        <div className="cd-lesson-list">
                            {LESSONS.map((l, i) => (
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
        </div>
    );
}