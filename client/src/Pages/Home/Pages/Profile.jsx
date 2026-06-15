import React, { useContext, useState, useRef, useEffect } from 'react'
import '../Styles/Profile.css'
import defaultPicture from '../../../Assets/images/default_picture.jpeg'
import { AppContext } from '../../../App'
import { ReactComponent as NewPost } from '../../../Assets/icons/TimelineIcons/new-post.svg'
import { ReactComponent as ArrowIcon } from '../../../Assets/icons/AuthIcons/next.svg'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import axios from 'axios'
import Loader from '../../../Partials/Components/Loader'
import CreatePost from '../Components/CreatePost'
import ToastMessage from '../../../Partials/Components/ToastMessage'

import { useNavigate } from 'react-router-dom'
import { PostCard } from '../Components/Post'

const COUNTRIES = [
    { id: 1, name: "Algeria" }
]
const STATES = [
    { id: 1, name: "Adrar" },
    { id: 2, name: "Chlef" },
    { id: 3, name: "Laghouat" },
    { id: 4, name: "Oum El Bouaghi" },
    { id: 5, name: "Batna" },
    { id: 6, name: "Béjaïa" },
    { id: 7, name: "Biskra" },
    { id: 8, name: "Béchar" },
    { id: 9, name: "Blida" },
    { id: 10, name: "Bouira" },
    { id: 11, name: "Tamanrasset" },
    { id: 12, name: "Tébessa" },
    { id: 13, name: "Tlemcen" },
    { id: 14, name: "Tiaret" },
    { id: 15, name: "Tizi Ouzou" },
    { id: 16, name: "Algiers" },
    { id: 17, name: "Djelfa" },
    { id: 18, name: "Jijel" },
    { id: 19, name: "Sétif" },
    { id: 20, name: "Saïda" },
    { id: 21, name: "Skikda" },
    { id: 22, name: "Sidi Bel Abbès" },
    { id: 23, name: "Annaba" },
    { id: 24, name: "Guelma" },
    { id: 25, name: "Constantine" },
    { id: 26, name: "Médéa" },
    { id: 27, name: "Mostaganem" },
    { id: 28, name: "M'Sila" },
    { id: 29, name: "Mascara" },
    { id: 30, name: "Ouargla" },
    { id: 31, name: "Oran" },
    { id: 32, name: "El Bayadh" },
    { id: 33, name: "Illizi" },
    { id: 34, name: "Bordj Bou Arréridj" },
    { id: 35, name: "Boumerdès" },
    { id: 36, name: "El Tarf" },
    { id: 37, name: "Tindouf" },
    { id: 38, name: "Tissemsilt" },
    { id: 39, name: "El Oued" },
    { id: 40, name: "Khenchela" },
    { id: 41, name: "Souk Ahras" },
    { id: 42, name: "Tipaza" },
    { id: 43, name: "Mila" },
    { id: 44, name: "Aïn Defla" },
    { id: 45, name: "Naâma" },
    { id: 46, name: "Aïn Témouchent" },
    { id: 47, name: "Ghardaïa" },
    { id: 48, name: "Relizane" },
    { id: 49, name: "Timimoun" },
    { id: 50, name: "Bordj Badji Mokhtar" },
    { id: 51, name: "Ouled Djellal" },
    { id: 52, name: "Béni Abbès" },
    { id: 53, name: "In Salah" },
    { id: 54, name: "In Guezzam" },
    { id: 55, name: "Touggourt" },
    { id: 56, name: "Djanet" },
    { id: 57, name: "El M'Ghair" },
    { id: 58, name: "El Meniaa" }
]

function Profile() {
    const { userAuth } = useContext(AppContext)
    const navigate = useNavigate()

    const [openEdit, setOpenEdit] = useState(false)
    const userImg = userAuth.userImg

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
                const res = await axios(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/users/user-infos`)
                setUser(res.data)


                const [postsRes, followersRes, followeesRes] = await Promise.all(
                    [await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/me`),
                    await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/get-followers`),
                    await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/get-followees`)]
                )
                setMyPosts(postsRes.data)
                setFollowers(followersRes.data)
                setFollowees(followeesRes.data)
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const [loadingCreate, setLoadingCreate] = useState(false)
    const [createPostClicked, setCreatePostClicked] = useState(false)
    const [postAdded, setPostAdded] = useState(false)

    const [toast, setToast] = useState({ visible: false, message: '', subMessage: '' });
    const triggerToast = (message, subMessage = 'Just now') => {
        setToast({ visible: true, message, subMessage });
    };

    const [followPopup, setFollowPopup] = useState({ visible: false, type: null })

    if (loading) {
        return (
            <div className="search-loading">
                <div className="loading-spinner" />
                <span>Fetching for posts...</span>
            </div>
        )
    }

    return (
        <div className='profile-page-container'>
            <div className="profile-page-wrapper">
                <div className="pp-header">
                    <div className="user-infos">
                        <div className="user-img">
                            <img src={userAuth.userImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${userImg}` : defaultPicture} alt="" />
                        </div>
                        <div className="user-stats">
                            <div className="username-edit-row">
                                <h2>{userAuth.userName}</h2>
                                <button className="edit-profile-btn" onClick={() => setOpenEdit(true)}>Edit Profile</button>
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
                        {userAuth.role === 'teacher' && (
                            <span className="pp-role-link" onClick={() => navigate('/my-courses')}>
                                My Courses <ArrowIcon className="pp-link-arrow" />
                            </span>
                        )}
                        {userAuth.role === 'student' && (
                            <span className="pp-role-link" onClick={() => navigate('/my-resources')}>
                                My Resources <ArrowIcon className="pp-link-arrow" />
                            </span>
                        )}
                    </div>
                    <div className="new-post" onClick={() => setCreatePostClicked(true)}>
                        <div className="new-post-circle">
                            <NewPost className="new-post-icon" />
                        </div>
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
                            // followees={followees}
                            // setFollowees={setFollowees}
                            />
                        ))
                    }
                </div>
            </div>
            <EditProfile
                visible={openEdit}
                onClose={() => setOpenEdit(false)}
                user={user}
                setUser={setUser}
            />
            {followPopup.visible && (
                <FollowPopup
                    type={followPopup.type}
                    followers={followers.followers}
                    followees={followees.followees}
                    onClose={() => setFollowPopup({ visible: false, type: null })}
                />
            )}
            {
                createPostClicked && <CreatePost
                    isOpen={createPostClicked}
                    onClose={() => setCreatePostClicked(false)}
                    setPosts={setMyPosts}
                    setPostAdded={setPostAdded}
                    setLoadingCreate={setLoadingCreate}
                />
            }
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

export const FollowPopup = ({ type, followers, followees, onClose }) => {
    const [search, setSearch] = useState('')
    const navigate = useNavigate()
    const list = type === 'followers' ? followers : followees

    const filtered = list.filter(u =>
        u?.userName?.toLowerCase().includes(search.toLowerCase()) ||
        u?.givenName?.toLowerCase().includes(search.toLowerCase()) ||
        u?.familyName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="follow-popup-overlay" onClick={onClose}>
            <div className="follow-popup" onClick={e => e.stopPropagation()}>
                <div className="follow-popup-header">
                    <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
                    <CloseIcon className="follow-popup-close" onClick={onClose} />
                </div>
                <div className="follow-popup-search">
                    <div className="search-wrapper">
                        <SearchIcon className="follow-search-icon" />
                        <input
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="follow-popup-list">
                    {filtered.length === 0 && (
                        <span className="follow-popup-empty">No users found</span>
                    )}
                    {filtered.map(u => (
                        <div key={u.id} className="follow-popup-item" onClick={() => navigate(`/users/${u.userName}/profile`)}>
                            <div className="follow-popup-img">
                                {u.userImg
                                    ? <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${u.userImg}`} alt={u.userName} />
                                    : <div className="user-initials-avatar" style={{ backgroundColor: 'var(--main-color)' }}>
                                        {u.familyName?.charAt(0).toUpperCase()}{u.givenName?.charAt(0).toUpperCase()}
                                    </div>
                                }
                            </div>
                            <div className="follow-popup-info">
                                <span className="follow-popup-username">{u.userName}</span>
                                <span className="follow-popup-name">{u.givenName} {u.familyName}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const EditProfile = ({ visible, onClose, user, setUser }) => {
    const { userAuth, setUserAuth } = useContext(AppContext)
    const [loading, setLoading] = useState(false)
    const [imgPreview, setImgPreview] = useState(null)
    const [imgFile, setImgFile] = useState(null)
    const fileRef = useRef(null)

    const [form, setForm] = useState({})

    useEffect(() => {
        if (!user || !user.id) return
        setForm({
            userName: user.userName || '',
            familyName: user.familyName || '',
            givenName: user.givenName || '',
            bio: user.bio || '',
            gender: user.gender || '',
            birthDate: user.dateOfBirth || '',
            phoneNumber: user.phoneNumber || '',
            addressLine1: user.address?.addressLine1 || '',   // also fix: was user.adress?.adressLine1
            city: user.address?.city || '',
            country: user.address?.country || '',
            placeOfWork: user.placeOfWork || '',
            grade: user.grade || '',
            levelOfEducation: user.levelOfEducation || '',
            institution: user.institution || '',
        })
    }, [user])

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleImgChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImgFile(file)
        setImgPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            if (imgFile) formData.append('userImg', imgFile)
            Object.entries(form).forEach(([key, val]) => {
                if (val) formData.append(key, val)
            })
            const { data } = await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/users/edit-profile`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            // re-fetch the full normalized user instead of trusting the PUT response
            const { data: freshUser } = await axios.get(
                `${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/users/user-infos`
            )

            setUserAuth(prev => ({
                ...prev,
                userName: freshUser.userName,
                familyName: freshUser.familyName,
                givenName: freshUser.givenName,
                userImg: freshUser.userImg,
            }))
            setUser(freshUser)
            console.log(data.address)
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`edit-profile-panel ${visible ? 'edit-profile-panel-open' : ''}`}>
            <div className="ep-header">
                <CloseIcon className="close-icon" onClick={onClose} />
                <span className="ep-title">Edit Profile</span>
            </div>

            <form className="ep-form" onSubmit={handleSubmit}>

                <div className="ep-avatar-row" onClick={() => fileRef.current?.click()}>
                    <div className="ep-avatar">
                        <img src={imgPreview || (userAuth.userImg ? `${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${userAuth.userImg}` : defaultPicture)} alt="avatar" />
                        <div className="ep-avatar-overlay">
                            <span>Change</span>
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImgChange} />
                </div>

                <div className="ep-section-label">Basic Info</div>

                <div className="ep-row">
                    <div className="ep-field">
                        <label>First name</label>
                        <input name="givenName" value={form.givenName} onChange={handleChange} placeholder="First name" />
                    </div>
                    <div className="ep-field">
                        <label>Last name</label>
                        <input name="familyName" value={form.familyName} onChange={handleChange} placeholder="Last name" />
                    </div>
                </div>

                <div className="ep-field">
                    <label>Username</label>
                    <input name="userName" value={form.userName} onChange={handleChange} placeholder="Username" />
                </div>

                <div className="ep-field">
                    <label>Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Write something about you..." rows={3} />
                </div>

                <div className="ep-row">
                    <div className="ep-field">
                        <label>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div className="ep-field">
                        <label>Birth date</label>
                        <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
                    </div>
                </div>

                <div className="ep-field">
                    <label>Phone</label>
                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+213 ..." />
                </div>

                <div className="ep-section-label">Address</div>

                <div className="ep-field">
                    <label>Street</label>
                    <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Street address" />
                </div>
                <div className="ep-row">
                    <div className="ep-field">
                        <label>Country</label>
                        <select name="country" value={form.country} onChange={handleChange}>
                            <option value="">Select</option>
                            {
                                COUNTRIES.map((c) => (
                                    <option value={c.name}>{c.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="ep-field">
                        <label>City</label>
                        <select name="city" value={form.city} onChange={handleChange}>
                            <option value="">Select</option>
                            {
                                STATES.map((s) => (
                                    <option value={s.name}>{s.name}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {userAuth.role === 'teacher' && (
                    <>
                        <div className="ep-section-label">Teaching Info</div>
                        <div className="ep-field">
                            <label>Place of work</label>
                            <input name="placeOfWork" value={form.placeOfWork} onChange={handleChange} placeholder="School / University" />
                        </div>
                        <div className="ep-field">
                            <label>Grade</label>
                            <input name="grade" value={form.grade} onChange={handleChange} placeholder="e.g. Professor, Lecturer" />
                        </div>
                    </>
                )}
                {userAuth.role === 'student' && (
                    <>
                        <div className="ep-section-label">Academic Info</div>
                        <div className="ep-field">
                            <label>Level of education</label>
                            <input name="levelOfEducation" value={form.levelOfEducation} onChange={handleChange} placeholder="e.g. Bachelor, Master" />
                        </div>
                        <div className="ep-field">
                            <label>Institution</label>
                            <input name="institution" value={form.institution} onChange={handleChange} placeholder="Your school or university" />
                        </div>
                    </>
                )}

                <button className="ep-save-btn" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    )
}

export default Profile
