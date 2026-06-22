import React, { useContext, useEffect, useState } from 'react'
import '../Styles/Posts.css'
import { PostCard } from '../Components/Post'
import Suggestions from './Suggestions'
import { ReactComponent as NewPost } from '../../../Assets/icons/TimelineIcons/new-post.svg'
import CreatePost from '../Components/CreatePost'
import PostPage from '../Components/PostPage'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { AppContext } from '../../../App'
import ToastMessage from '../../../Partials/Components/ToastMessage'
import Loader from '../../../Partials/Components/Loader'

function PostsFeed() {

    const { t } = useTranslation()

    const { getPosts, userAuth } = useContext(AppContext)

    const [createPostClicked, setCreatePostClicked] = useState(false)

    const [postPageVisible, setPostPageVisible] = useState({
        visible: false,
        post: null
    })

    const [selectedPost, setSelectedPost] = useState({
        selected: false,
        _id: null,
        content: '',
        mediaUrl: '',
        mediaType: '',
        tags: [],
        mentions: [],
        urls: [],
        comments: [],
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        user: {
            userId: 0,
            userName: "",
            familyName: "",
            givenName: "",
            userImg: "",
            role: ""
        }
    })

    const [posts, setPosts] = useState([])

    const [postAdded, setPostAdded] = useState(false)
    const [followees, setFollowees] = useState({
        followees: [],
        followeesIds: []
    })

    const [loading, setLoading] = useState(false)
    const [loadingCreate, setLoadingCreate] = useState(false)

    useEffect(() => {

        const fectchPosts = async () => {
            try {
                setLoading(true)
                axios.defaults.withCredentials = true

                const link = userAuth.role === "parent" ? `${process.env.REACT_APP_API_URL_GATEWAY}/posts/parent-hub` : `${process.env.REACT_APP_API_URL_GATEWAY}/posts`

                const resPosts = await axios.get(link)
                setPosts(resPosts.data)

                const resFollowees = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/get-followees`)
                setFollowees(resFollowees.data)

            } catch (error) {
                console.error("error while fecthing posts", error)
            } finally {
                setLoading(false)
            }
        }

        fectchPosts()

    }, [getPosts])

    const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' });
    const triggerToast = (message, subMessage = 'Just now') => {
        setToast({ visible: true, message, subMessage });
    };

    useEffect(() => {
        if (!postAdded) return;
        triggerToast("Your post has been published with success")
    }, [postAdded]);

    const handleUpdatePostComments = (comments) => {
        setSelectedPost({ ...selectedPost, comments: comments })
    }

    const handleUpdatePostReplies = (reply, commentId) => {
        setSelectedPost((prev) => ({
            ...prev,
            comments: prev.comments.map((c) =>
                c._id === commentId
                    ? { ...c, replies: [...(c.replies || []), reply] }
                    : c
            ),
            commentsCount: prev.commentsCount + 1
        }));
    }

    return (
        <div className='postsfeed-container'>
            <div className="postsfeed-wrapper">
                <div className="posts-column">
                    <div className="postsfeed-flex-column">
                        {
                            loading && <div className="search-loading">
                                <div className="loading-spinner" />
                                <span>Fetching for posts...</span>
                            </div>
                        }
                        {posts.map((post) => (
                            <PostCard
                                key={post.postId}
                                postUserId={post.userId}
                                postMedia={post.mediaUrl}
                                postText={post.content}
                                postUserName={post.user.userName}
                                mediaType={post.mediaType}
                                post={post}
                                openPostPage={() => setPostPageVisible({ visible: true, post: post })}
                                setPosts={setPosts}
                                followees={followees}
                                setFollowees={setFollowees}
                            />
                        ))}
                    </div>
                </div>
                <Suggestions />
                <div className="new-post-btn-wrapper">
                    <button className='new-post-btn' onClick={() => setCreatePostClicked(true)}>
                        <NewPost />
                        {t('posts.newPost')}
                        <span className="stars">
                            <span></span><span></span><span></span><span></span><span></span><span></span>
                        </span>
                    </button>
                </div>
            </div>
            {
                createPostClicked && <CreatePost
                    isOpen={createPostClicked}
                    onClose={() => setCreatePostClicked(false)}
                    setPosts={setPosts}
                    setPostAdded={setPostAdded}
                    setLoadingCreate={setLoadingCreate}
                />
            }

            {postPageVisible.visible &&
                <PostPage
                    selectedPost={postPageVisible.post}
                    visible={postPageVisible.visible}
                    onClose={() => setPostPageVisible({ visible: false, post: null })}
                    changePostComments={handleUpdatePostComments}
                    changeCommentReplies={handleUpdatePostReplies}
                    setPosts={setPosts}
                    followees={followees}
                    setFollowees={setFollowees}
                />}

            <ToastMessage
                visible={toast.visible}
                message={toast.message}
                subMessage={toast.subMessage}
                onClose={() => setToast(t => ({ ...t, visible: false }))}
            />
            {
                loadingCreate && <Loader />
            }
        </div>
    )
}

export default PostsFeed
