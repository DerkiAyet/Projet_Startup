import React, { useState, useEffect, useRef, useContext } from 'react'
import '../Styles/Posts.css'
import defaultPicture from '../../../Assets/images/default_picture.jpeg'
import { ReactComponent as MoreIcon } from '../../../Assets/icons/TimelineIcons/more-horiz-post.svg'
import { ReactComponent as LikeIcon } from '../../../Assets/icons/TimelineIcons/like-post.svg'
import { ReactComponent as CommentIcon } from '../../../Assets/icons/TimelineIcons/comment-post.svg'
import { ReactComponent as ShareIcon } from '../../../Assets/icons/TimelineIcons/share-post.svg'
import { ReactComponent as FullHeartIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg'
import { AppContext } from '../../../App'
import { TimeLineContext } from '../Pages/PostsFeed'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

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

export const PostCard = ({ postText = "", postMedia = "", postUserName = "", mediaType = "", post, postUserId }) => {

    const { t } = useTranslation()

    const { setSelectedPost, setPosts, followees, setFollowees } = useContext(TimeLineContext)

    const openPostPage = () => {
        setSelectedPost({ selected: true, ...post })
    }

    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 150;

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

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

    const { userAuth } = useContext(AppContext)
    const showOptionsRef = useRef(null);
    const showOptionsBtnRef = useRef(null);

    const [showOptions, setShowOptions] = useState(false)

    useEffect(() => {

        const handleShowOptions = (e) => {
            if (showOptionsRef.current &&
                !showOptionsRef.current.contains(e.target) &&
                showOptionsBtnRef.current &&
                !showOptionsBtnRef.current.contains(e.target)
            ) {
                setShowOptions(false);
            }
        }

        document.addEventListener('mousedown', handleShowOptions);

        return () => {
            document.removeEventListener('mousedown', handleShowOptions)
        }

    }, [])

    const [showDelete, setShowDelete] = useState(false);

    const toggleShowDelete = () => setShowDelete(!showDelete)

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

                setIsLiked(updatedLikes.some((l) => l.userId === userAuth.userId));
            })
            .catch((err) => console.error(err));
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
    return (
        <div className="post-card-wrapper">
            <div className="post-card">
                <div className="post-owner-infos">
                    <div className="owner-infos">
                        <img className='post-user-img' src={defaultPicture} alt="user profile" />
                        <div className="user-credentials">
                            <h5>{post.user.userName}</h5>
                            <div className="coordinates">
                                <span> {post.user.role} </span>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.54574 6.00416C5.79887 6.00416 6.00407 5.79896 6.00407 5.54583C6.00407 5.2927 5.79887 5.08749 5.54574 5.08749C5.29261 5.08749 5.0874 5.2927 5.0874 5.54583C5.0874 5.79896 5.29261 6.00416 5.54574 6.00416Z" stroke="black" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <span className='post-time'>
                                    {timeAgo(post.createdAt, t)}
                                </span>
                            </div>
                        </div>
                        {
                            userAuth.userId !== postUserId && !followees.followeesIds.includes(postUserId) &&
                            <span
                                className="demande-follow"
                                style={{ cursor: 'pointer', }}
                                onClick={() => toggleFollow(postUserId)}
                            >
                                {t('posts.follow')}
                            </span>
                        }

                    </div>
                    <div className="more-icon-wrapper" style={{ position: "relative" }}>
                        <MoreIcon
                            ref={showOptionsBtnRef}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowOptions(true)} />

                        {
                            showOptions &&
                            <div className="post-options-container" ref={showOptionsRef}>
                                <ul>
                                    {
                                        userAuth.userId !== postUserId && followees.followeesIds.includes(postUserId) &&
                                        <li>
                                            <p
                                                className='serious-action'
                                                style={{ color: 'rgb(237, 73, 86)', fontWeight: '500', cursor: "pointer" }}
                                                onClick={() => toggleFollow(postUserId)}
                                            >
                                                {t('posts.unfollow')}
                                            </p>
                                        </li>
                                    }
                                    {
                                        userAuth.userName === postUserName &&
                                        <>
                                            <li style={{ cursor: "pointer" }}>
                                                <p>{t('posts.edit')}</p>
                                            </li>
                                            <li onClick={toggleShowDelete} style={{ cursor: "pointer" }}>
                                                <p style={{ color: 'rgb(237, 73, 86)', fontWeight: '500' }}>{t('posts.delete')}</p>
                                            </li>
                                        </>
                                    }
                                    <li style={{ cursor: "pointer" }} onClick={openPostPage}>
                                        <p>{t('posts.goToPost')}</p>
                                    </li>
                                    <li style={{ cursor: "pointer" }}>
                                        <p>{t('posts.aboutAccount')}</p>
                                    </li>
                                    <li style={{ borderBottom: 'none', cursor: "pointer" }}>
                                        <p>{t('posts.cancel')}</p>
                                    </li>
                                </ul>
                            </div>
                        }
                    </div>

                </div>
                {
                    postMedia ? <>
                        <div className='post-img-container'>
                            {mediaType === 'video' ? (
                                <video
                                    src={`http://localhost:8080/posts/uploads/${postMedia}` || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                                    controls
                                    loop
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                                />
                            ) : (
                                <img
                                    src={`http://localhost:8080/posts/uploads/${postMedia}` || 'https://picsum.photos/seed/postpage/600/600'}
                                    alt="post"
                                    className='post-img'
                                    onClick={openPostPage}
                                />
                            )}
                        </div>
                        <div className="post-text">
                            <span> {post.user.userName} </span>
                            {postText.length > maxLength && !isExpanded
                                ? `${postText.substring(0, maxLength)}...`
                                : formatTextWithLineBreaks(postText)}
                            {postText.length > maxLength && (
                                <span className="read-more" onClick={toggleReadMore}>
                                    {isExpanded ? ` ${t('posts.readLess')}` : ` ${t('posts.readMore')}`}
                                </span>
                            )}
                        </div>
                    </> : <>
                        <div className="post-text-without-img">
                            {postText.length > maxLength && !isExpanded
                                ? `${postText.substring(0, maxLength)}...`
                                : formatTextWithLineBreaks(postText)}
                            {postText.length > maxLength && (
                                <span className="read-more" onClick={toggleReadMore}>
                                    {isExpanded ? ` ${t('posts.readLess')}` : ` ${t('posts.readMore')}`}
                                </span>
                            )}
                        </div>
                    </>
                }

                <div className="icons-line">
                    <div className="icon-flex">
                        {
                            isLiked ?
                                <FullHeartIcon className="post-icon" onClick={toggleLike} /> :
                                <LikeIcon className="post-icon" onClick={toggleLike} />
                        }
                        {post.likesCount}
                    </div>
                    <div className="icon-flex">
                        <CommentIcon className="post-icon" onClick={openPostPage} />
                        {post.commentsCount}
                    </div>
                    <ShareIcon className="share-post-icon" />
                </div>
            </div>
        </div>
    )
}