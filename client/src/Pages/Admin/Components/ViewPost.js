import React, { useRef, useEffect, useState, useContext } from 'react';
import '../../Home/Styles/PostPage.css';
import '../Styles/ViewPost.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as EmojiIcon } from '../../../Assets/icons/TimelineIcons/emoji-icon.svg'
import { AppContext } from '../../../App';
import { ReactComponent as LikeIcon } from '../../../Assets/icons/TimelineIcons/like-post.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg'
import { ReactComponent as ShareIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg'
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg'
import { ReactComponent as FullHeartIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg'
import { ReactComponent as MoreIcon } from '../../../Assets/icons/TimelineIcons/more-horiz-post.svg'
import axios from 'axios'
import { useTranslation } from 'react-i18next';
import Loader from '../../../Partials/Components/Loader';
import { HideItem } from './HideItem';
import { SendWarning } from './SendWarning';
import { DeleteConfirmPopup } from '../../../Shared/Components/DeletePopup';


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


export const CommentLine = ({ postId, commentId, commentTxt, commentUserName, commentUserImg, replies = [], commentUserFamily, commentUserGiven, commentBody = { likes: [], replies: [], _id: 0, userId: 0, text: "" } }) => {

    const { t } = useTranslation()

    const [isExpanded, setIsExpanded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyClicked, setReplyClicked] = useState(false);
    const [commentReplies, setCommentReplies] = useState(replies)
    const [reply, setReply] = useState('')
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

    return (
        <div className="comment-line">
            <div className="comment-user-img" style={{ flexShrink: 0 }}>
                {
                    commentUserImg ?
                        <img src={commentUserImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${commentUserImg}` : '/default_picture.jpeg'} alt="comment user" /> :
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

                {showReplies && (
                    <div className="replies-container" style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid var(--color-border-tertiary)', width: "100%" }}>
                        {commentReplies.map((reply) => (
                            <CommentLine
                                key={reply._id}
                                postId={postId}
                                commentId={commentId}
                                commentTxt={reply.text}
                                commentUserName={reply.userName}
                                commentUserImg={reply.userImg}
                                commentUserFamily={reply.familyName}
                                commentUserGiven={reply.givenName}
                                replies={[]}
                                commentBody={reply}
                            />
                        ))}
                    </div>
                )}
            </div>

            <LikeIcon className="comment-icon" style={{ flexShrink: 0 }} />
        </div>
    );
};


function ViewPost({ reportId, postId, visible, onClose, onSendWarning }) {

    const { t } = useTranslation()

    const [post, setPost] = useState({});
    const [comments, setComments] = useState([]);
    const [commentBody, setCommentBody] = useState({ postId: post.postId, commentText: '' });
    const [loading, setLoading] = useState(false)

    const [openMenu, setOpenMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL_GATEWAY}/posts/post-info/${postId}`,
                    { withCredentials: true, timeout: 3000 }
                )
                setPost(res.data)
                setComments(res.data.comments)
                console.log(res.data._id)
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData();
    }, [])

    const postPageRef = useRef(null);
    const [hideActionOpen, setHideActionOpen] = useState(false)
    const [sendWarningOpen, setSendWarningOpen] = useState(false)

    if (!visible) return null
    if (loading || !post.user) return <Loader />

    return (
        <div className='post-page-overlay'>
            <div className="post-page-container" ref={postPageRef}>
                <div className="post-img-container">
                    {!post.mediaUrl ? (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        }}>
                            <i className="ri-image-off-line" style={{
                                fontSize: '3rem',
                                color: '#444',
                            }} />
                            <span style={{
                                fontSize: '0.85rem',
                                color: '#555',
                                letterSpacing: '0.05em',
                            }}>
                                {t('posts.noMediaAvailable')}
                            </span>
                        </div>
                    ) : post.mediaType === 'video' ? (
                        <video
                            src={`${process.env.REACT_APP_API_URL_GATEWAY}/posts/uploads/${post.mediaUrl}` || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                            controls
                            loop
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <img
                            src={`${process.env.REACT_APP_API_URL_GATEWAY}/posts/uploads/${post.mediaUrl}` || 'https://picsum.photos/seed/postpage/600/600'}
                            alt="post"
                        />
                    )}
                </div>
                <div className="post-comments-section">
                    <div className="post-owner-line">
                        <div className="post-owner-infos">
                            <div className="post-owner-img">
                                {
                                    post.user.userImg ?
                                        <img
                                            src={post.user.userImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${post.user.userImg}` : '../../../Assests/images/default_picture.jpeg'}
                                            alt="post owner"
                                        /> :
                                        <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                            {post.user.familyName?.charAt(0).toUpperCase()}
                                            {post.user.givenName?.charAt(0).toUpperCase()}
                                        </div>
                                }
                            </div>
                            <span style={{ fontWeight: '420', fontSize: '1.1rem' }}>{post.user.userName}</span>
                            <div style={{ marginLeft: "auto", position: "relative" }}>
                                <MoreIcon
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setOpenMenu((prev) => !prev)}
                                />

                                {openMenu && (
                                    <div className="admin-dropdown">
                                        <button
                                            onClick={() => {
                                                setHideActionOpen(true);
                                                setOpenMenu(false);
                                            }}
                                        >
                                            Hide
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSendWarningOpen(true)
                                                setOpenMenu(false);
                                            }}
                                            style={{
                                                color: "rgb(237, 73, 86)"
                                            }}
                                        >
                                            Send warning
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <CloseIcon onClick={onClose} style={{ cursor: 'pointer' }} />

                    </div>
                    <div className="post-comments-container">
                        <CommentLine
                            postId={post._id}
                            commentTxt={post.content || ''}
                            commentUserName={post.user.userName}
                            commentUserImg={post.user.userImg}
                            commentUserFamily={post.user.familyName}
                            commentUserGiven={post.user.givenName}
                        />
                        {comments?.map((comment) => (
                            <CommentLine
                                key={comment._id}
                                postId={post._id}
                                commentId={comment._id}
                                commentTxt={comment.text || ''}
                                commentUserName={comment.userName}
                                commentUserImg={comment.userImg}
                                replies={comment.replies || []}
                                commentUserFamily={comment.familyName}
                                commentUserGiven={comment.givenName}
                                commentBody={comment}
                            />
                        ))}
                    </div>
                    <div className="icons-container">
                        <div className="icons-line">
                            <div className="icons-first-line">
                                <div className="icon-flex">
                                    <LikeIcon className="post-icon" />
                                    {post.likesCount > 0 && <span>{post.likesCount}</span>}
                                </div>
                                <div className="icon-flex">
                                    <CommentIcon className="post-icon" />
                                    {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
                                </div>
                                <ShareIcon />
                            </div>
                            <SaveIcon className="post-icon" />
                        </div>
                        <span className="post-time-ago">
                            {timeAgo(post.createdAt, t)}
                        </span>

                    </div>
                </div>
            </div>
            {
                hideActionOpen &&
                <HideItem
                    onClose={() => setHideActionOpen(false)}
                    type={"post"}
                    targetId={post.userId}
                    refId={postId}
                    reportId={reportId}
                />
            }
            {
                sendWarningOpen &&
                <SendWarning
                    onClose={() => setSendWarningOpen(false)}
                    targetId={post.userId}
                    reportId={reportId}
                />
            }
        </div >
    );
}

export default ViewPost;