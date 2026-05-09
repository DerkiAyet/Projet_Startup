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

export const TimeLineContext = React.createContext()

function PostsFeed() {

    const { t } = useTranslation()

    const { getPosts, userAuth } = useContext(AppContext)

    const [createPostClicked, setCreatePostClicked] = useState(false)

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

    return (
        <TimeLineContext.Provider value={{ selectedPost, setSelectedPost, posts, setPosts, setPostAdded, followees, setFollowees, setLoadingCreate }}>
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
                                />
                            ))}
                        </div>
                    </div>
                    <Suggestions />
                    <div className="new-post-btn-wrapper">
                        <button className='new-post-btn' onClick={() => setCreatePostClicked(true)}>
                            <NewPost />
                            New Post
                            <span className="stars">
                                <span></span><span></span><span></span><span></span><span></span><span></span>
                            </span>
                        </button>
                    </div>
                </div>
                {
                    createPostClicked && <CreatePost isOpen={createPostClicked} onClose={() => setCreatePostClicked(false)} />
                }

                {selectedPost.selected && <PostPage />}

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
        </TimeLineContext.Provider >
    )
}

export default PostsFeed
