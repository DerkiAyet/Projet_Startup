import React, { useRef, useEffect, useState, useContext } from 'react';
import '../Styles/PostPage.css';
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as EmojiIcon } from '../../../Assets/icons/TimelineIcons/emoji-icon.svg'
import { AppContext } from '../../../App';
import EmojiPicker from 'emoji-picker-react';
import { ReactComponent as LikeIcon } from '../../../Assets/icons/TimelineIcons/like-post.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg'
import { ReactComponent as ShareIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg'
import { ReactComponent as SaveIcon } from '../../../Assets/icons/TimelineIcons/bookmark.svg'
import { ReactComponent as FullHeartIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg'

import { TimeLineContext } from '../Pages/PostsFeed';
import axios from 'axios'
import { useTranslation } from 'react-i18next';


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


export const CommentLine = ({ postId, commentId, commentTxt, commentUserName, commentUserImg, replies = [], commentUserFamily, commentUserGiven, onAddReply, commentBody = { likes: [], replies: [], _id: 0, userId: 0, text: "" }, userId, toggleLike }) => {

    const {t} = useTranslation()

    const [isExpanded, setIsExpanded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyClicked, setReplyClicked] = useState(false);
    const [commentReplies, setCommentReplies] = useState(replies)
    const [reply, setReply] = useState('');
    const [isLiked, setIsLiked] = useState(commentBody.likes.some((l) => l.userId === userId))
    const maxLength = 150;

    const { setPosts } = useContext(TimeLineContext)

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

        try {
            const res = await axios.post(
                `http://localhost:8080/posts/${postId}/comment/${commentId}/reply`,
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

            setPosts((prev) =>
                prev.map((p) =>
                    p._id === postId
                        ? {
                            ...p,
                            comments: p.comments.map((c) =>
                                c._id === commentId
                                    ? { ...c, replies: [...c.replies, newReply] }
                                    : c
                            ),
                            commentsCount: p.commentsCount + 1
                        }
                        : p
                )
            );

            onAddReply?.(newReply, commentId);

            setCommentReplies([...commentReplies, newReply]);

            setReplyClicked(false);

            setReply('')

        } catch (err) {
            console.error(err?.response?.data || err);
        }
    };

    const toggleLikeReply = (replyId, setLiked) => {

        console.log("postId:", postId);
        console.log("commentId:", commentId);   // should be parent comment's _id
        console.log("replyId:", replyId);

        axios
            .post(`http://localhost:8080/posts/${postId}/comment/${commentId}/reply/${replyId}/like`, {},
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
                                postId={postId}
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
                                placeholder= {t('posts.writeReply')}
                                className="add-reply-input"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                            />
                            <button className="post-reply-btn" onClick={addReply}>{t('posts.post')}</button>
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

// ─── PostPage ─────────────────────────────────────────────────────────────────

function PostPage() {

    const {t} = useTranslation()

    const { selectedPost, setSelectedPost } = useContext(TimeLineContext)

    const emptiedThePost = () => setSelectedPost({
        selected: false,
        postId: null,
        content: '',
        mediaUrl: '',
        mediaType: '',
        tags: [],
        mentions: [],
        urls: [],
        comments: [],
        likes: [],
        user: {
            userId: 0,
            userName: "",
            familyName: "",
            givenName: "",
            userImg: "",
            role: ""
        }
    })

    const [post, setPost] = useState(selectedPost);
    const [comments, setComments] = useState(selectedPost.comments);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [commentBody, setCommentBody] = useState({ postId: post.postId, commentText: '' });
    const { darkMode, userAuth } = useContext(AppContext);
    const { setPosts, followees, setFollowees } = useContext(TimeLineContext)

    const showEmojiPickerRef = useRef(null);
    const postPageRef = useRef(null);


    // Close options dropdown on outside click
    useEffect(() => {
        const handleShowOptions = (e) => {
            if (
                showEmojiPickerRef.current &&
                !showEmojiPickerRef.current.contains(e.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleShowOptions);
        return () => document.removeEventListener('mousedown', handleShowOptions);
    }, []);

    // ── Add Comment ─────────────────────────────────────────────────────────

    const onSubmit = async (e) => {

        e.preventDefault();

        if (!commentBody.commentText.trim()) return;

        axios.defaults.withCredentials = true

        try {

            const res = await axios.post(`http://localhost:8080/posts/${post._id}/comment`,
                { text: commentBody.commentText },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            )


            const newComment = {
                userId: res.data.userId,
                text: commentBody.commentText,
                userName: userAuth.userName,
                familyName: userAuth.familyName,
                givenName: userAuth.givenName,
                userImg: userAuth.userImg
            };

            setComments([...comments, newComment])

            setPosts((prev) =>
                prev.map((p) =>
                    p._id === post._id
                        ? {
                            ...p,
                            comments: [comments],
                            commentsCount: p.commentsCount + 1
                        }
                        : p
                )
            );

            setSelectedPost({ ...selectedPost, comments: comments })
            setPost(selectedPost)
            setCommentBody({ ...commentBody, commentText: '' })

        } catch (error) {
            console.error(error.response.data)
        }
    };

    // ── Like ────────────────────────────────────────────────────────────────

    const [isLiked, setIsLiked] = useState(
        post.likes.some((l) => l.userId === userAuth.userId) // the .find retuurns object while .some return true or false
    );

    const toggleLike = () => {
        axios
            .post(
                `http://localhost:8080/posts/${post._id}/like`,
                {},
                { headers: { "Content-Type": "application/json" } }
            )
            .then((res) => {
                const updatedLikes = res.data.likes;
                const updatedLikesCount = updatedLikes.length;

                setPosts((prev) =>
                    prev.map((p) =>
                        p._id === post._id
                            ? { ...p, likes: updatedLikes, likesCount: updatedLikesCount }
                            : p
                    )
                );

                setPost({ ...post, likesCount: updatedLikesCount })

                setIsLiked(updatedLikes.some((l) => l.userId === userAuth.userId));
            })
            .catch((err) => console.error(err));
    };

    const onAddReply = (reply, commentId) => {
        setSelectedPost((prev) => ({
            ...prev,
            comments: prev.comments.map((c) =>
                c._id === commentId
                    ? { ...c, replies: [...(c.replies || []), reply] }
                    : c
            ),
            commentsCount: prev.commentsCount + 1
        }));
        setPost(selectedPost)
    };

    // ── Emoji ───────────────────────────────────────────────────────────────

    // EmojiPicker kept as-is — just wire it up without axios side-effects
    const addEmoji = (emojiObject) => {
        setCommentBody({ ...commentBody, commentText: commentBody.commentText + emojiObject.emoji });
    };

    const toggleFollow = (followeeId) => {
        axios.defaults.withCredentials = true

        axios.post('http://localhost:8080/posts/follow', { followeeId: followeeId }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((res) => {

                if (res.data.followAdded) {
                    const newFollowee = {
                        followeeUserName: post.user.userName,
                        followeeFamilyName: post.user.familyName,
                        followeeGivenName: post.user.givenName,
                        followeeUserImg: post.user.userImg
                    }

                    setFollowees((prev) => ({
                        ...prev,
                        followeesIds: [...prev.followeesIds, followeeId],
                        followees: [...prev.followees, newFollowee]
                    }))
                } else {
                    setFollowees((prev) => ({
                        ...prev,
                        followeesIds: prev.followeesIds.filter((id) => id !== followeeId),
                        followees: prev.followees.filter(
                            (f) => f.followeeUserName !== post.user.userName
                        )
                    }));
                }

                console.log(followees)
            })
    }

    const toggleLikeComment = (commentId, setLiked) => {
        axios
            .post(`http://localhost:8080/posts/${post._id}/comment/${commentId}/like`, {},
                { headers: { "Content-Type": "application/json" } })
            .then((res) => {
                const updatedComment = res.data.comments.find(c => c._id === commentId);
                const nowLiked = updatedComment?.likes.some(l => l.userId === userAuth.userId) ?? false;

                setPost((prev) => ({
                    ...prev,
                    comments: prev.comments.map((c) =>
                        c._id === commentId ? updatedComment : c
                    )
                }));

                setLiked(nowLiked); // pass the actual value
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className='post-page-overlay'>
            <div className="post-page-container" ref={postPageRef}>
                {/* Post image */}
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
                            src={`http://localhost:8080/posts/uploads/${post.mediaUrl}` || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                            controls
                            loop
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <img
                            src={`http://localhost:8080/posts/uploads/${post.mediaUrl}` || 'https://picsum.photos/seed/postpage/600/600'}
                            alt="post"
                        />
                    )}
                </div>
                <div className="post-comments-section">
                    {/* Owner line */}
                    <div className="post-owner-line">
                        <div className="post-owner-infos">
                            <div className="post-owner-img">
                                {
                                    post.user.userImg ?
                                        <img
                                            src={post.user.userImg || '../../../Assests/images/default_picture.jpeg'}
                                            alt="post owner"
                                        /> :
                                        <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                            {post.user.familyName?.charAt(0).toUpperCase()}
                                            {post.user.givenName?.charAt(0).toUpperCase()}
                                        </div>
                                }
                            </div>
                            <span style={{ fontWeight: '420', fontSize: '1.1rem' }}>{post.user.userName}</span>
                            {!followees.followeesIds.includes(post.userId) && userAuth.userId !== post.userId && (
                                <span
                                    className="demande-follow"
                                    style={{ cursor: 'pointer', }}
                                    onClick={() => toggleFollow(post.userId)}
                                >
                                    {t('posts.follow')}
                                </span>
                            )}
                        </div>
                        <CloseIcon onClick={emptiedThePost} style={{ cursor: 'pointer' }} />

                    </div>
                    {/* Comments list */}
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
                                onAddReply={onAddReply}
                                commentBody={comment}
                                userId={userAuth.userId}
                                toggleLike={toggleLikeComment}
                            />
                        ))}
                    </div>
                    {/* Icons */}
                    <div className="icons-container">
                        <div className="icons-line">
                            <div className="icons-first-line">
                                <div className="icon-flex">
                                    {
                                        isLiked ?
                                            <FullHeartIcon className="post-icon" onClick={toggleLike} /> :
                                            <LikeIcon className="post-icon" onClick={toggleLike} />
                                    }
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
                    {/* Comment input */}
                    <div className="comment-input">
                        <form method="POST" className="add-comment-form" onSubmit={onSubmit}>

                            <div className="emoji-counter-line" >
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
                                    placeholder= {t('posts.addComment')}
                                    value={commentBody.commentText}
                                    onChange={(e) =>
                                        setCommentBody({ ...commentBody, commentText: e.target.value })
                                    }
                                />
                            </div>
                            <button type="submit" className="post-btn"> {t('posts.post')}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default PostPage;