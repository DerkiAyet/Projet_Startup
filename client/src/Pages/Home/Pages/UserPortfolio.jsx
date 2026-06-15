import React, { useState, useEffect } from 'react'
import '../Styles/Profile.css'
import defaultPicture from '../../../Assets/images/default_picture.jpeg'
import { ReactComponent as ArrowIcon } from '../../../Assets/icons/AuthIcons/next.svg'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { PostCard } from '../Components/Post'
import { FollowPopup } from './Profile'


function UserPortfolio() {
    const { userName } = useParams()
    const navigate = useNavigate()

    const [user, setUser] = useState({})
    const [myPosts, setMyPosts] = useState([])
    const [followers, setFollowers] = useState({
        followers: [],
        followersIds: []
    })
    const [followees, setFollowees] = useState({
        followees: [],
        followeesIds: []
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await axios(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/users/${userName}`)
                setUser(res.data)


                const [postsRes, followStatsRes] = await Promise.all(
                    [await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/users/${userName}`),
                    await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/users/${userName}/follow-stats`)]
                )
                setMyPosts(postsRes.data)
                setFollowers(followStatsRes.data.followersData)
                setFollowees(followStatsRes.data.followeesData)
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userName])

    const [followPopup, setFollowPopup] = useState({ visible: false, type: null })

    if (loading) {
        return (
            <div className='profile-page-container'>
                <div className="profile-page-wrapper">
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <span>Fetching for posts...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='profile-page-container'>
            <div className="profile-page-wrapper">
                <div className="pp-header">
                    <div className="user-infos">
                        <div className="user-img">
                            <img src={user.userImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${user.userImg}` : defaultPicture} alt="" />
                        </div>
                        <div className="user-stats">
                            <div className="username-edit-row">
                                <h2>{user.userName}</h2>
                            </div>
                            <span className='bio'>
                                {user.bio ?? "..."}
                            </span>
                            <div className="user-activity">
                                <span>{myPosts.length} posts</span>
                                <span onClick={() => setFollowPopup({ visible: true, type: 'followers' })}>
                                    {followers.followersIds.length} followers
                                </span>
                                <span onClick={() => setFollowPopup({ visible: true, type: 'following' })}>
                                    {followees.followeesIds.length} following
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="pp-role-links">
                        {user.role === 'teacher' && (
                            <span className="pp-role-link" onClick={() => navigate(`/teacher/${userName}/courses`)}>
                                Dr. {user.familyName} Courses <ArrowIcon className="pp-link-arrow" />
                            </span>
                        )}
                        {user.role === 'student' && (
                            <span className="pp-role-link" onClick={() => navigate(`/student/${userName}/resources`)}>
                                {user.givenName} Resources <ArrowIcon className="pp-link-arrow" />
                            </span>
                        )}
                    </div>
                </div>
                <div className="pp-body">
                    {
                        myPosts.map((post) => (
                            <PostCard
                                key={post.postId}
                                postUserId={post.userId}
                                postMedia={post.mediaUrl}
                                postText={post.content}
                                postUserName={post.user.userName}
                                mediaType={post.mediaType}
                                post={post}
                                // openPostPage={() => setPostPageVisible({ visible: true, post: post })}
                                // setPosts={setPosts}
                                followees={followees}
                            // setFollowees={setFollowees}
                            />
                        ))
                    }
                </div>
            </div>
            {followPopup.visible && (
                <FollowPopup
                    type={followPopup.type}
                    followers={followers.followers}
                    followees={followees.followees}
                    onClose={() => setFollowPopup({ visible: false, type: null })}
                />
            )}
        </div>
    )
}

export default UserPortfolio
