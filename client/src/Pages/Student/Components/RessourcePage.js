import React, { useRef, useEffect, useState, useContext } from 'react';
import '../Styles/RessourcePage.css';
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as EmojiIcon } from '../../../Assets/icons/TimelineIcons/emoji-icon.svg'
import { ReactComponent as ScrollIcon } from '../../../Assets/icons/CourseIcons/next-icon.svg'
import { AppContext } from '../../../App';
import EmojiPicker from 'emoji-picker-react';
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg'
import { ReactComponent as ShareIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg'
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg'
import { ReactComponent as LikeIcon } from '../../../Assets/icons/TimelineIcons/like-post.svg'
import { ReactComponent as FullHeartIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg'
import axios from 'axios'
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom'


const timeAgo = (dateString, t) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);
    const intervals = [
        { label: t('posts.year'), seconds: 31536000, plural: t('posts.years') },
        { label: t('posts.month'), seconds: 2592000, plural: t('posts.months') },
        { label: t('posts.week'), seconds: 604800, plural: t('posts.weeks') },
        { label: t('posts.day'), seconds: 86400, plural: t('posts.days') },
        { label: t('posts.hour'), seconds: 3600, plural: t('posts.hours') },
        { label: t('posts.minute'), seconds: 60, plural: t('posts.minutes') },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            const label = count === 1 ? interval.label : interval.plural;
            return `${count} ${label} ${t('posts.ago')}`;
        }
    }
    return t('posts.justNow');
};

// ─── Star Rating ─────────────────────────────────────────────────────────────

const StarRating = ({ resourceId, currentRating, onRate }) => {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= (hovered || currentRating) ? 'filled' : ''}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onRate(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

// ─── Attachment Viewer ────────────────────────────────────────────────────────

const AttachmentViewer = ({ attachments = [], thumbnail }) => {
    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState(false);

    // If no attachments, fall back to thumbnail
    const items = attachments.length > 0
        ? attachments
        : thumbnail ? [{ fileUrl: thumbnail, fileType: 'image', _fallback: true }] : [];

    if (items.length === 0) {
        return (
            <div className="attachment-empty">
                <i className="ri-file-line" style={{ fontSize: '3rem', color: '#444' }} />
                <span style={{ fontSize: '0.85rem', color: '#555' }}>No attachments</span>
            </div>
        );
    }

    const item = items[current];
    const fileUrl = item._fallback
        ? item.fileUrl
        : `${process.env.REACT_APP_API_URL_GATEWAY}/content/uploads/${item.fileUrl}`;

    const prev = () => setCurrent(i => Math.max(0, i - 1));
    const next = () => setCurrent(i => Math.min(items.length - 1, i + 1));

    const renderContent = () => {
        if (item.fileType === 'image') {
            return <img src={fileUrl} alt={`attachment-${current}`} className="attachment-img" onClick={() => setLightbox(true)} />;
        }
        if (item.fileType === 'pdf') {
            return (
                <iframe
                    src={fileUrl}
                    title={`attachment-pdf-${current}`}
                    className="attachment-iframe"
                />
            );
        }
        // All other types — download prompt
        return (
            <div className="attachment-download">
                <i className="ri-file-download-line" style={{ fontSize: '3rem', color: '#aaa' }} />
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{item.fileUrl?.split('/').pop()}</span>
                <a
                    href={fileUrl}
                    download
                    className="download-btn"
                    onClick={e => e.stopPropagation()}
                >
                    Download
                </a>
            </div>
        );
    };

    return (
        <div className="attachment-viewer">
            {renderContent()}

            {items.length > 1 && (
                <>
                    <button
                        className="attachment-nav prev"
                        onClick={prev}
                        disabled={current === 0}
                    >
                        <ScrollIcon className="scroll-icon" />
                    </button>
                    <button
                        className="attachment-nav next"
                        onClick={next}
                        disabled={current === items.length - 1}
                    >
                        <ScrollIcon className="scroll-icon" style={{transform: "rotate(180deg)"}} />
                    </button>
                    <div className="attachment-counter">
                        {current + 1} / {items.length}
                    </div>
                </>
            )}
            {lightbox && ReactDOM.createPortal(
                <div className="lightbox-overlay" onClick={() => setLightbox(false)}>
                    <button className="lightbox-close" onClick={e => { e.stopPropagation(); setLightbox(false); }}>
                        <CloseIcon className="lightbox-icon" />
                    </button>
                    <img
                        src={fileUrl}
                        alt="full view"
                        className="lightbox-img"
                        onClick={e => e.stopPropagation()}
                    />
                </div>,
                document.body  // ← must be document.body, not a ref inside the component
            )}
        </div>
    );
};

// ─── CommentLine ──────────────────────────────────────────────────────────────

export const CommentLine = ({ resourceId, commentId, commentTxt, commentUserName, commentUserImg, replies = [], commentUserFamily, commentUserGiven, onAddReply, commentBody = { likes: [], replies: [], _id: 0, userId: 0, text: "" }, userId, toggleLike }) => {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyClicked, setReplyClicked] = useState(false);
    const [commentReplies, setCommentReplies] = useState(replies)
    const [reply, setReply] = useState('');
    const [isLiked, setIsLiked] = useState(() => {
        if (!commentBody?.likes || !Array.isArray(commentBody.likes)) return false;
        return commentBody.likes.some((l) => l.userId === userId);
    });
    const maxLength = 150;

    const toggleReadMore = () => setIsExpanded(!isExpanded);

    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, index) =>
            urlRegex.test(part) ? (
                <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>{part}</a>
            ) : part
        );
    }

    function formatTextWithLineBreaks(text) {
        return text.split("\n").map((line, index) => (
            <React.Fragment key={index}>{linkify(line)}<br /></React.Fragment>
        ));
    }

    const addReply = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resourceId}/comment/${commentId}/reply`,
                { text: `@${commentUserName} ${reply}` },
                { headers: { "Content-Type": "application/json" } }
            );
            const newReply = {
                userId: res.data.userId,
                text: `@${commentUserName} ${reply}`,
                userName: commentUserName,
                familyName: commentUserFamily,
                givenName: commentUserGiven,
                userImg: commentUserImg
            };
            onAddReply?.(newReply, commentId);
            setCommentReplies([...commentReplies, newReply]);
            setReplyClicked(false);
            setReply('');
        } catch (err) {
            console.error(err?.response?.data || err);
        }
    };

    const toggleLikeReply = (replyId, setLiked) => {
        axios
            .post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resourceId}/comment/${commentId}/reply/${replyId}/like`, {},
                { headers: { "Content-Type": "application/json" } })
            .then((res) => {
                const updatedComment = res.data.comments?.find(c => c._id === commentId);
                const updatedReply = updatedComment?.replies.find(r => r._id === replyId);
                const nowLiked = updatedReply?.likes.some(l => l.userId === userId) ?? false;
                setCommentReplies(prev => prev.map(r => r._id === replyId ? updatedReply : r));
                setLiked(nowLiked);
            })
            .catch(err => console.error(err));
    };

    return (
        <div className="comment-line">
            <div className="comment-user-img" style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                {commentUserImg
                    ? <img src={commentUserImg} alt="comment user" style={{ flexShrink: 0 }} />
                    : <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)', flexShrink: 0 }}>
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

                <div className="comment-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {commentReplies.length > 0 && (
                        <span className="view-replies" onClick={() => setShowReplies(!showReplies)}
                            style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '24px', borderTop: '1px solid #aaa' }} />
                            {showReplies ? t('posts.hideReplies') : `${t('posts.viewReplies')} (${commentReplies.length})`}
                        </span>
                    )}
                    <span className="view-replies" onClick={() => setReplyClicked(!replyClicked)}
                        style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#aaa' }}>
                        {t('posts.reply')}
                    </span>
                </div>

                {showReplies && (
                    <div className="replies-container" style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid var(--color-border-tertiary)', width: "100%" }}>
                        {commentReplies.map(reply => (
                            <CommentLine
                                key={reply._id}
                                resourceId={resourceId}
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

                {replyClicked && (
                    <div className="add-reply-container">
                        <textarea
                            placeholder={t('posts.writeReply')}
                            className="add-reply-input"
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                        />
                        <button className="post-reply-btn" onClick={addReply}>{t('posts.post')}</button>
                    </div>
                )}
            </div>

            {isLiked
                ? <FullHeartIcon className="comment-icon" style={{ flexShrink: 0 }} onClick={() => toggleLike(commentBody._id, nowLiked => setIsLiked(nowLiked))} />
                : <LikeIcon className="comment-icon" style={{ flexShrink: 0 }} onClick={() => toggleLike(commentBody._id, nowLiked => setIsLiked(nowLiked))} />
            }
        </div>
    );
};

// ─── RessourcePage ────────────────────────────────────────────────────────────

function RessourcePage({ selectedResource, visible, onClose, changeResourceComments, changeCommentReplies }) {
    const { t } = useTranslation()
    const { darkMode, userAuth } = useContext(AppContext);
    const [resource, setResource] = useState(selectedResource);
    const [comments, setComments] = useState(selectedResource.comments || []);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [commentBody, setCommentBody] = useState({ commentText: '' });
    const userRatingData = selectedResource.ratings.find((r) => String(r.userId) ===String(userAuth.userId))
    const [userRating, setUserRating] = useState(userRatingData?.rating ?? 0);

    const showEmojiPickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showEmojiPickerRef.current && !showEmojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!commentBody.commentText.trim()) return;
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resource._id}/comment`,
                { text: commentBody.commentText },
                { headers: { "Content-Type": "application/json" } }
            );
            const newComment = {
                userId: res.data.userId,
                text: commentBody.commentText,
                userName: userAuth.userName,
                familyName: userAuth.familyName,
                givenName: userAuth.givenName,
                userImg: userAuth.userImg
            };
            const updated = [...comments, newComment];
            setComments(updated);
            changeResourceComments?.(updated);
            setCommentBody({ commentText: '' });
        } catch (error) {
            console.error(error.response?.data);
        }
    };

    const handleRate = (star) => {
        setUserRating(star);
        axios.post(
            `${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resource._id}/rating`,
            { rating: star },
            { headers: { "Content-Type": "application/json" } }
        ).catch(err => console.error(err));
    };

    const onAddReply = (reply, commentId) => {
        changeCommentReplies?.(reply, commentId);
    };

    const addEmoji = (emojiObject) => {
        setCommentBody(prev => ({ ...prev, commentText: prev.commentText + emojiObject.emoji }));
    };

    const toggleLikeComment = (commentId, setLiked) => {
        axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content/resources/${resource._id}/comment/${commentId}/like`, {},
            { headers: { "Content-Type": "application/json" } })
            .then(res => {
                const nowLiked = res.data.likes?.some(l => l.userId === userAuth.userId) ?? false;
                setResource(prev => ({
                    ...prev,
                    comments: prev.comments?.map(c => c._id === commentId ? res.data : c)
                }));
                setLiked(nowLiked);
            })
            .catch(err => console.error(err));
    };

    if (!visible) return null;

    return (
        <div className='post-page-overlay'>
            <div className="post-page-container">

                {/* ── Left: Attachment Viewer ── */}
                <div className="post-img-container" style={{ position: 'relative', background: '#111' }}>
                    <AttachmentViewer
                        attachments={resource.attachments || []}
                        thumbnail={resource.thumbnail}
                    />
                </div>

                <div className="post-comments-section">

                    <div className="post-owner-line">
                        <div className="post-owner-infos">
                            <div className="post-owner-img">
                                {resource.student?.userImg
                                    ? <img src={resource.student.userImg} alt="owner" />
                                    : <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                        {resource.student?.familyName?.charAt(0).toUpperCase()}
                                        {resource.student?.givenName?.charAt(0).toUpperCase()}
                                    </div>
                                }
                            </div>
                            <span style={{ fontWeight: '420', fontSize: '1.1rem' }}>{resource.student?.userName}</span>
                        </div>
                        <CloseIcon onClick={onClose} style={{ cursor: 'pointer' }} />
                    </div>

                    {/* Comments list */}
                    <div className="post-comments-container">
                        {/* Resource description as top comment */}
                        <CommentLine
                            resourceId={resource._id}
                            commentTxt={resource.description || resource.title || ''}
                            commentUserName={resource.student?.userName}
                            commentUserImg={resource.student?.userImg}
                            commentUserFamily={resource.student?.familyName}
                            commentUserGiven={resource.student?.givenName}
                        />
                        {comments.map(comment => (
                            <CommentLine
                                key={comment._id}
                                resourceId={resource._id}
                                commentId={comment._id}
                                commentTxt={comment.text || ''}
                                commentUserName={comment.userName}
                                commentUserImg={comment.userImg}
                                replies={comment.replies || []}
                                commentUserFamily={comment.familyName}
                                commentUserGiven={comment.givenName}
                                onAddReply={onAddReply}
                                commentBody={comment}
                                userId={userAuth.userId}
                                toggleLike={toggleLikeComment}
                            />
                        ))}
                    </div>

                    {/* Stats + Rating */}
                    <div className="icons-container">
                        <div className="icons-line">
                            <div className="icons-first-line">
                                <div className="icon-flex">
                                    <CommentIcon className="post-icon" />
                                    {resource.commentsCount > 0 && <span>{resource.commentsCount}</span>}
                                </div>
                                <ShareIcon className="post-icon" />
                            </div>
                            <SaveIcon className="post-icon" />
                        </div>

                        {/* Rating row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <StarRating
                                resourceId={resource._id}
                                currentRating={userRating}
                                onRate={handleRate}
                            />
                            {resource.avgRating > 0 && (
                                <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                                    {resource.avgRating.toFixed(1)} avg
                                </span>
                            )}
                        </div>

                        <span className="post-time-ago">{timeAgo(resource.createdAt, t)}</span>
                    </div>

                    {/* Comment input */}
                    <div className="comment-input">
                        <form className="add-comment-form" onSubmit={onSubmit}>
                            <div className="emoji-counter-line">
                                <EmojiIcon onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                                {showEmojiPicker && (
                                    <div ref={showEmojiPickerRef} className="emoji-picker-container">
                                        <EmojiPicker
                                            className='emojie-picker-post'
                                            theme={darkMode ? 'dark' : 'light'}
                                            onEmojiClick={addEmoji}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="input-container">
                                <textarea
                                    className="add-comment-input"
                                    placeholder={t('posts.addComment')}
                                    value={commentBody.commentText}
                                    onChange={e => setCommentBody({ commentText: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="post-btn">{t('posts.post')}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RessourcePage;