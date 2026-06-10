import React, { useContext, useState, useEffect, useRef, use } from 'react'
import '../Styles/CreatePost.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as ImgDeco } from '../../../Assets/icons/TimelineIcons/img-decoration-post.svg'
import { ReactComponent as ChangeIcon } from '../../../Assets/icons/TimelineIcons/change.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EmojiIcon } from '../../../Assets/icons/TimelineIcons/emoji-icon.svg'
import { ReactComponent as TagIcon } from '../../../Assets/icons/TimelineIcons/tag-icon.svg'
import { ReactComponent as MentionIcon } from '../../../Assets/icons/TimelineIcons/mention-icon.svg'
import EmojiPicker from 'emoji-picker-react';

import { AppContext } from '../../../App'
import axios from 'axios'

function CreatePost({ isOpen, onClose, setPosts, setPostAdded, setLoadingCreate }) {

    const { userAuth, darkMode } = useContext(AppContext);

    let givenName = userAuth.givenName || '';
    let familyName = userAuth.familyName || '';
    const profilePicture = userAuth.userImg || '';
    const isParent = userAuth.role === "parent"

    const [newPost, setNewPost] = useState({
        content: "",
        media: null,
        tags: [],
        mentions: [],
        urls: [],
        isParentHub: isParent
    });

    // to fetch tags and urls
    const parseContent = (content) => {
        const tags = [...content.match(/#[a-zA-Z0-9_]+/g) || []]
            .map(t => t.slice(1)); // remove #

        const urls = [...content.match(/https?:\/\/[^\s]+/g) || []];

        return { tags, urls };
    };

    const [selectedImage, setSelectedImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // -----------------------------
    // ADDED: TAGS + MENTIONS STATES
    // -----------------------------
    const [showTagBox, setShowTagBox] = useState(false);
    const tagBoxRef = useRef(null);
    const [showMentionBox, setShowMentionBox] = useState(false);
    const mentionBoxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tagBoxRef.current && !tagBoxRef.current.contains(event.target)) {
                setShowTagBox(false);
            }
            if (mentionBoxRef.current && !mentionBoxRef.current.contains(event.target)) {
                setShowMentionBox(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Example tags (you can load them from backend)
    const tagsList = ["learning", "physics", "algebra", "coding", "motivation", "education", "tips", "study"];

    // Example people list
    const [mentionSearch, setMentionSearch] = useState("");
    const peopleList = [
        { id: 1, name: "Sarah Johnson", img: "https://i.pravatar.cc/60?img=1" },
        { id: 2, name: "Michael Chen", img: "https://i.pravatar.cc/60?img=2" },
        { id: 3, name: "Amina Rahmani", img: "https://i.pravatar.cc/60?img=3" },
        { id: 4, name: "John Smith", img: "https://i.pravatar.cc/60?img=4" },
        { id: 5, name: "Alex Brown", img: "https://i.pravatar.cc/60?img=5" },
    ];

    const filteredPeople = peopleList.filter(person =>
        person.name.toLowerCase().includes(mentionSearch.toLowerCase())
    );

    // CHARACTER COUNTER
    const charLimit = 1000;

    const handleChangeMedia = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) { // 100MB
            alert("File is too large! Maximum size is 100MB.");
            return;
        }

        const type = file.type;

        // Reset both media states
        setSelectedImage(null);
        setImageFile(null);
        setVideoFile(null);
        setVideoPreview(null);

        if (type.startsWith("image/")) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        }
        else if (type.startsWith("video/")) {
            setVideoFile(file);
            const videoURL = URL.createObjectURL(file);
            setVideoPreview(videoURL);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImageFile(null);
        setVideoFile(null);
        setVideoPreview(null);
        const fileInput = document.getElementById('postImg');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
        const fileInput = document.getElementById('postImg');
        if (fileInput) fileInput.value = '';
    };

    const handleChangeImage = () => {
        document.getElementById('postImg').click();
    };

    const addEmoji = (emojiObject) => {
        if (newPost.content.length >= charLimit) return;
        setNewPost(prevPost => ({
            ...prevPost,
            content: prevPost.content + emojiObject.emoji
        }));
    };

    // -----------------------------
    // ADD TAG TO CONTENT
    // -----------------------------
    const selectTag = (tag) => {
        if (!newPost.tags.includes(tag)) {
            setNewPost(prev => ({
                ...prev,
                tags: [...prev.tags, tag],
                content: prev.content + ` #${tag}`
            }));
        }
        setShowTagBox(false);
    };

    // -----------------------------
    // ADD MENTION TO CONTENT
    // -----------------------------
    const selectMention = (person) => {
        if (!newPost.mentions.includes(person.id)) {
            setNewPost(prev => ({
                ...prev,
                mentions: [...prev.mentions, person.id],
                content: prev.content + ` @${person.name.replace(" ", "").toLowerCase()}`
            }));
        }
        setShowMentionBox(false);
    };

    // -----------------------------
    // Submit Post
    // -----------------------------

    const onSubmit = async (e) => {
        e.preventDefault()

        axios.defaults.withCredentials = true

        const formData = new FormData()

        formData.append("content", newPost.content)
        formData.append("media", imageFile ?? videoFile) // ?? picks the first defined value
        formData.append("tags", JSON.stringify(newPost.tags))
        formData.append("mentions", JSON.stringify(newPost.mentions))
        formData.append("urls", JSON.stringify(newPost.urls))
        formData.append("isParentHub", newPost.isParentHub)

        try {
            setLoadingCreate(true)
            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/`, formData)

            const newPost = {
                ...res.data,
                likesCount: 0,
                commentsCount: 0,
                user: {
                    userId: userAuth.userId,
                    userName: userAuth.userName,
                    familyName: userAuth.familyName,
                    givenName: userAuth.givenName,
                    userImg: userAuth.userImg,
                    role: userAuth.role
                }
            }

            setPosts((prev) => [newPost, ...prev])
            onClose()
            setPostAdded(true)
        } catch (error) {
            console.error(error.response.data)
        } finally {
            setLoadingCreate(false)
        }
    }

    if (!isOpen) return null;

    return (
        <div className="create-post-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>

                <div className="create-post-header">
                    <CloseIcon style={{ cursor: "pointer" }} onClick={onClose} />
                    <h3>Create New Post</h3>
                    <button className='submit-btn' onClick={onSubmit}>Share</button>
                </div>

                <form className="create-post-content">

                    {/* IMAGE UPLOAD SECTION */}
                    <div className="flex-img-drop-box">
                        <input className='drop-img-btn'
                            type="file"
                            accept="image/*,video/*"
                            id='postImg'
                            style={{ display: 'none' }}
                            onChange={handleChangeMedia}
                        />

                        {selectedImage ? (
                            /* IMAGE PREVIEW */
                            <div className='post-img-box'>
                                <img src={selectedImage} alt="Selected" />
                                <div className="image-overlay-buttons">
                                    <button type="button" className="floating-btn change-btn" onClick={handleChangeImage}>
                                        <ChangeIcon />
                                    </button>
                                    <button type="button" className="floating-btn delete-btn" onClick={handleRemoveImage}>
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>

                        ) : videoPreview ? (
                            /* VIDEO PREVIEW */
                            <div className='post-img-box'>
                                <video src={videoPreview} controls />
                                <div className="image-overlay-buttons">
                                    <button type="button" className="floating-btn change-btn" onClick={handleChangeImage}>
                                        <ChangeIcon />
                                    </button>
                                    <button type="button" className="floating-btn delete-btn" onClick={handleRemoveVideo}>
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>

                        ) : (
                            <>
                                <ImgDeco />
                                <span>Drop your image/video here</span>
                                <div className='enter-image-form'>
                                    <label htmlFor="postImg">Select from computer</label> {/* it will trigger the hidden file input when clicked */}
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="right-side-post-form">
                        <div className="user-top-line">
                            <div className="user-profile-pic">
                                {profilePicture ? (
                                    <div className="user-account">
                                        <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${profilePicture}`} alt="Profile" />
                                    </div>
                                ) : (
                                    <div className="user-initials-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}>
                                        {givenName.charAt(0)}{familyName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="user-name"><b>{userAuth.familyName} {userAuth.givenName} </b></span>
                        </div>

                        {/* TEXTAREA + EMOJI + COUNT */}
                        <div className="flex-text-box">
                            <div className='textarea-box'>
                                <textarea
                                    className="post-input"
                                    placeholder="What's on your mind?"
                                    value={newPost.content}
                                    onChange={(e) => {
                                        const text = e.target.value.slice(0, charLimit);
                                        const parsed = parseContent(text);

                                        setNewPost(prev => ({
                                            ...prev,
                                            content: text,
                                            tags: parsed.tags,
                                            urls: parsed.urls
                                        }));
                                    }}
                                />
                            </div>

                            <div className="emoji-counter-line" style={{ position: "relative" }}>
                                <EmojiIcon onClick={() => setShowEmojiPicker(!showEmojiPicker)} />

                                {/* COUNT */}
                                <span>{newPost.content.length}/{charLimit}</span>

                                {showEmojiPicker && (
                                    <EmojiPicker
                                        className='emoji-picker'
                                        theme={darkMode ? 'dark' : 'light'}
                                        onEmojiClick={addEmoji}
                                    />
                                )}
                            </div>
                        </div>

                        {/* TAGS + MENTIONS BUTTONS */}
                        <div className="tag-mention-flex-box">
                            <div className="tag-mention-line" onClick={() => {
                                setShowTagBox(!showTagBox);
                                setShowMentionBox(false);
                            }}>
                                <span>Add Tag</span>
                                <TagIcon />
                            </div>

                            <div className="tag-mention-line" onClick={() => {
                                setShowMentionBox(!showMentionBox);
                                setShowTagBox(false);
                            }}>
                                <span>Mention a Friend</span>
                                <MentionIcon />
                            </div>
                        </div>
                    </div>
                </form>

                {/* TAG SELECTOR BOX */}
                {showTagBox && (
                    <div className="popup-box tags-box" ref={tagBoxRef}>
                        <h4>Select Tag</h4>
                        <div className="tags-list">
                            {tagsList.map(tag => (
                                <button key={tag} onClick={() => selectTag(tag)} className="tag-item">
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* MENTION SELECTOR BOX */}
                {showMentionBox && (
                    <div className="popup-box mention-box" ref={mentionBoxRef}>
                        <h4>Mention Someone</h4>
                        <input
                            className="mention-search"
                            placeholder="Search..."
                            value={mentionSearch}
                            onChange={e => setMentionSearch(e.target.value)}
                        />

                        <div className="mention-list">
                            {filteredPeople.slice(0, 5).map(person => (
                                <div key={person.id} className="mention-item" onClick={() => selectMention(person)}>
                                    <img src={person.img} alt="" />
                                    <span>{person.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default CreatePost