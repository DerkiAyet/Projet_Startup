import React, { useContext, useRef } from 'react'
import '../Styles/ClassroomPage.css'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { AppContext } from '../../../App'
import { useSocket } from "../../../Utilities/config/useSocket"
import startChat from '../../../Assets/images/chat.png'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import NotFound from '../../../Assets/images/find-course.png'
import { AddPostForm } from '../Components/AddPost'
import { fixMediaUrl } from '../../../Utilities/utils/fixMedia'
import { AddSessionForm } from '../Components/AddSession'

axios.defaults.withCredentials = true

const initials = (name) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const Avatar = ({ name, size, pic }) => (
    <div className="avatar" style={size ? { '--sz': size } : {}}>
        {
            pic ? <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${pic}`} alt='user' />
                :
                <div className="avatar-placeholder">{initials(name)}</div>
        }
    </div>
);

function ClassroomPage() {

    const socket = useSocket()
    const { userAuth } = useContext(AppContext)

    const fenetres = ["Messages", "Homework", "Sessions"]
    const [currentFentre, setCurrentFenetre] = useState("Messages")

    const { classroomId } = useParams()
    const [classroom, setClassroom] = useState([])
    const [messages, setMessages] = useState([])
    const [posts, setPosts] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!socket) return         // important so the socket will moount preperly
        if (!classroomId) return 

        socket.emit('join_classroom', { classroomId })
        console.log('Joined classroom room:', classroomId)

        return () => {
            socket.emit('leave_classroom', { classroomId })
        }
    }, [classroomId, socket])

    useEffect(() => {
        if (!socket) return

        socket.on("classroom:new_message", ({ classroomId: incomingRoomId, message }) => {
            if (String(incomingRoomId) === String(classroomId)) {
                setMessages(prev => [...prev, message])  // ← always fresh
            }
        })

        socket.on("classroom:new_post", ({ classroomId: incomingRoomId, post }) => {
            if (String(incomingRoomId) === String(classroomId)) {
                setPosts(prev => [...prev, post])
            }
        })

        socket.on("classroom:new_session", ({ classroomId: incomingRoomId, session }) => {
            if (String(incomingRoomId) === String(classroomId)) {
                setSessions(prev => [...prev, session])
            }
        })

        return () => {
            socket.off("classroom:new_message")
            socket.off("classroom:new_post")
            socket.off("classroom:new_session")
        }
    }, [socket, classroomId])

    useEffect(() => {
        const fetchData = async () => {
            try {

                setLoading(true)

                const classroomRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}`)
                setClassroom(classroomRes.data)
                console.log(classroomRes.data)

                const postsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/posts`)
                setPosts(postsRes.data)

                const sessionsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/sessions/of-classroom/${classroomId}`)
                setSessions(sessionsRes.data)

                const messagesRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/messages`)
                setMessages(messagesRes.data)
            } catch (error) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [classroomId])

    const [showMembersPanel, setShowMembersPanel] = useState(false)
    const sidePanelParams = ["Members", "Requests"]
    const [currentSidePanelParam, setCurrentSidePanelParam] = useState("Members")

    const getDate = (data) => {
        const dateOnly = data
            ? new Date(data).toLocaleDateString()
            : null;

        return dateOnly
    }

    const handleLeaveGroup = () => {
        console.log("leave...")
    }

    const handleAccept = async (studentId) => {
        try { 
            await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/accept/${studentId}`)
            setClassroom(prev => ({
                ...prev,
                pendingRequests: prev.pendingRequests.filter(r => String(r.student.id) !== String(studentId)),
                members: [...prev.members, prev.pendingRequests.find(r => String(r.student.id) === String(studentId))?.student]
            }))
        } catch (err) {
            console.error(err.message)
        }
    }

    const handleReject = async (studentId) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${classroomId}/reject/${studentId}`)
            setClassroom(prev => ({
                ...prev,
                pendingRequests: prev.pendingRequests.filter(r => String(r.student.id) !== String(studentId))
            }))
        } catch (err) {
            console.error(err.message)
        }
    }

    const [addPostClicked, setAddPostClicked] = useState(false)
    const [addSessionClicked, setAddSessionClicked] = useState(false)


    if (loading) {
        return (
            <div className="search-loading">
                <div className="loading-spinner" />
                <span>Fetching for data please stand by...</span>
            </div>
        )
    }

    return (
        <div className='cp-container'>
            <div className="cp-wrapper">
                <div className="header-cp">
                    <div className="link-line" style={{ textTransform: "capitalize" }}>
                        <Link to="/classrooms">Classrooms</Link> &gt; <span>{classroom.name}</span>
                    </div>
                    <div className="cp-infos" style={{ backgroundColor: "transparent" }}>
                        <div className="avatar">
                            <div className="avatar-placeholder">
                                {classroom?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="cp-infos-info">
                            <div className="cp-infos-name">{classroom.name}</div>
                        </div>
                        <div className="cp-infos-actions">
                            <button className="header-icon-btn" style={{ color: "#000" }} onClick={() => setShowMembersPanel(true)}>
                                <i className="ri-more-fill" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="cp-fenetres">
                    {
                        fenetres.map((f) => (
                            <button className={`fenetre-chip ${currentFentre === f ? "active" : ""}`} onClick={() => setCurrentFenetre(f)}>{f}</button>
                        ))
                    }
                </div>
                <div className="cp-core-body">
                    {currentFentre === "Messages" &&
                        (<MessagesPanel
                            messages={messages}
                            idClassroom={classroomId}
                            author={classroom?.creator?.id}
                        />
                        )}
                    {currentFentre === "Homework" &&
                        (<PostsPanel
                            posts={posts}
                            idClassroom={classroomId}
                            author={classroom?.creator?.id}
                            addPost={() => setAddPostClicked(true)}
                        />
                        )}
                    {currentFentre === "Sessions" && (
                        <SessionsPanel
                            sessions={sessions}
                            idClassroom={classroomId}
                            author={classroom?.creator?.id}
                            addSession={() => setAddSessionClicked(true)}
                        />
                    )}
                </div>
            </div>
            {showMembersPanel && (
                <div className="members-panel">
                    <div className="members-panel-header">

                        {userAuth.role === "teacher" ? <div className="cp-fenetres" style={{ padding: 0, margin: 0, width: "100%", border: 0 }}>
                            {
                                sidePanelParams.map((p) => (
                                    <button className={`fenetre-chip ${currentSidePanelParam === p ? "active" : ""}`} onClick={() => setCurrentSidePanelParam(p)}>{p}</button>
                                ))
                            }
                        </div> :
                            <div>
                                <span className="members-panel-title">
                                    {currentSidePanelParam === "Members" ? `Members (${classroom?.members?.length})` : `Members (${classroom?.pendingRequests?.length})`}
                                </span>
                            </div>
                        }
                        <button className="header-icon-btn" onClick={() => setShowMembersPanel(false)}>
                            <CloseIcon />
                        </button>
                    </div>

                    {
                        currentSidePanelParam === "Members" ?
                            <>
                                <div className="members-list">
                                    <div className="member-row">
                                        <Avatar name={`${classroom?.creator?.givenName} ${classroom?.creator?.familyName}`} pic={classroom?.creator?.userImg} />
                                        <div className="member-info">
                                            <span className="member-name">
                                                {classroom?.creator?.givenName} {classroom?.creator?.familyName}
                                                {String(classroom?.creator?.id) === String(userAuth.userId) && (
                                                    <span className="member-you-tag">you</span>
                                                )}
                                            </span>
                                            <span className="member-username">@{classroom?.creator?.userName}</span>
                                            <span className="member-admin-badge">Teacher</span>
                                        </div>
                                    </div>
                                    {classroom.members?.map((member) => (
                                        <div key={member.id} className="member-row">
                                            <Avatar name={`${member.givenName} ${member.familyName}`} pic={member.userImg} />
                                            <div className="member-info">
                                                <span className="member-name">
                                                    {member.givenName} {member.familyName}
                                                    {String(member.id) === String(userAuth.userId) && (
                                                        <span className="member-you-tag">you</span>
                                                    )}
                                                </span>
                                                <span className="member-username">@{member.userName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="members-panel-footer">
                                    <button className="leave-group-btn" onClick={handleLeaveGroup}>
                                        <i className="ri-logout-box-r-line" />
                                        Leave Classroom
                                    </button>
                                </div>
                            </> : <>
                                <div className="members-list">
                                    {classroom.pendingRequests?.map((request) => (
                                        <div className="request-col">
                                            <div key={request.userId} className="member-row">
                                                <Avatar name={`${request.student?.givenName} ${request.student?.familyName}`} pic={request.student?.userImg} />
                                                <div className="member-info">
                                                    <span className="member-name">
                                                        {request.student?.givenName} {request.student?.familyName}
                                                    </span>
                                                    <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "0.66rem" }}>Requested at: {getDate(request.requestedAt)}</p>
                                                    <span className="member-username">@{request.student?.userName}</span>
                                                </div>
                                            </div>
                                            {userAuth.role === "teacher" && (
                                                <div className="request-actions">
                                                    <button className="accept-btn" onClick={() => handleAccept(request.student?.id)}>
                                                        Accept
                                                    </button>
                                                    <button className="reject-btn" onClick={() => handleReject(request.student?.id)}>
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                    }

                </div>
            )}

            {
                addPostClicked && <AddPostForm onClose={() => setAddPostClicked(false)} />
            }
            {addSessionClicked && (
                <AddSessionForm
                    onClose={() => setAddSessionClicked(false)}
                />
            )}
        </div>
    )
}

const MessagesPanel = ({ messages, idClassroom, author }) => {

    const { userAuth } = useContext(AppContext) 
    const messagesEndRef = useRef(null)
    const [inputVal, setInputVal] = useState('')

    // ── scroll to bottom on new message ────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        try {
            if (!inputVal.trim()) return

            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${idClassroom}/messages`,
                { message: inputVal.trim() },
                { headers: { "Content-Type": "application/json" } }
            )

            setInputVal('')
        } catch (error) {
            console.error("error while sending the message", error)
        }
    }

    return (
        <>
            {messages.length === 0 ? (
                <div className='empty-chat-side'>
                    <div className="empty-panel-wrap">
                        <img src={startChat} alt="start chat" style={{ height: "150px" }} />
                        <h3>This space is waiting for a story — start a chat!</h3>
                    </div>
                </div>
            ) : (
                <div className="messages-area">
                    {messages.map(msg => {
                        const isSent = String(msg.senderId) === String(userAuth.userId)
                        const senderName = `${msg.senderInfos?.givenName ?? ''} ${msg.senderInfos?.familyName ?? ''}`
                        const senderProfile = msg.senderInfos?.userImg

                        return (
                            <div key={msg._id} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                                {!isSent && (
                                    <div className="msg-avatar-wrap">
                                        <Avatar name={senderName} pic={senderProfile} />
                                        <span className="msg-sender-name">
                                            {author === msg.senderId ? "Teacher" : (msg.senderInfos?.givenName ?? '')}
                                        </span>
                                    </div>
                                )}
                                <div className="bubble">
                                    {msg.message}        {/* ← matches your model field name */}
                                    <div className="bubble-meta">
                                        <span className="bubble-time">
                                            {new Date(msg.sentAt ?? msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isSent && (
                                            <span className="read-ticks">
                                                {msg.readBy?.length > 1 ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}

            <div className="chat-input-bar">
                <div className="chat-input-wrap">
                    <button className="input-icon-btn"><i className="bx bx-smile" /></button>
                    <textarea
                        placeholder="Type a message..."
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        style={{ resize: "none" }}
                    />
                    <button className="input-icon-btn"><i className="ri-attachment-2" /></button>
                </div>
                <button className="send-btn" onClick={sendMessage}>
                    <i className="ri-send-plane-fill" />
                </button>
            </div>
        </>
    )
}

const PostsPanel = ({ posts, idClassroom, author, addPost }) => {
    const { userAuth } = useContext(AppContext)
    const messagesEndRef = useRef(null)
    const [inputVal, setInputVal] = useState('')

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [posts])

    const isTeacher = String(author) === String(userAuth.userId)

    const sendTextPost = async () => {
        if (!inputVal.trim()) return
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/classrooms/${idClassroom}/posts`,
                { type: "text", content: inputVal.trim() },
                { headers: { "Content-Type": "application/json" } }
            )
            setInputVal('')
        } catch (error) {
            console.error("error sending post", error)
        }
    }

    const navigate = useNavigate()

    const handleClick = (contentId, type) => {
        navigate(`/courses/${contentId}?type=${type}`)
    }

    return (
        <>
            {posts.length === 0 ? (
                <div className='empty-chat-side'>
                    <div className="empty-panel-wrap">
                        <img src={NotFound} alt="no homework" style={{ height: "150px" }} />
                        <h3>No homework yet — waiting for the teacher!</h3>
                    </div>
                </div>
            ) : (
                <div className="messages-area">
                    {posts.map(post => (
                        <PostBubble key={post._id} post={post} isOwn={true} handleClick={handleClick} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {isTeacher && (
                <div className="chat-input-bar">
                    <div className="chat-input-wrap">
                        <textarea
                            placeholder="Write a text homework message..."
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            style={{ resize: "none" }}
                        />
                        <button className="send-btn" onClick={sendTextPost}>
                            <i className="ri-send-plane-fill" />
                        </button>
                    </div>
                    <div className="add-circle" onClick={addPost} title="Add course or assignment">+</div>
                </div>
            )}
        </>
    )
}

const PostBubble = ({ post, handleClick }) => {
    const getDate = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (post.type === "text") {
        return (
            <div className="msg-row sent">
                <div className="bubble post-text-bubble">
                    {post.content}
                    <div className="bubble-meta">
                        <span className="bubble-time">{getDate(post.createdAt)}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="msg-row sent" onClick={() => handleClick(post.refId, post.type)}>
            <div className="post-content-card">
                <div className="post-card-type-badge">
                    <i className={post.type === "course" ? "ri-book-open-line" : "ri-task-line"} />
                    {post.type}
                </div>
                <div className="post-card-inner" style={{ cursor: "pointer" }}>
                    <div className="post-card-thumb">
                        {post.refThumbnail
                            ? <img src={fixMediaUrl(post.refThumbnail)} alt={post.refTitle} />
                            : <div className="post-card-thumb-fallback">{post.refTitle?.charAt(0)}</div>
                        }
                    </div>
                    <div className="post-card-info">
                        <span className="post-card-title">{post.refTitle}</span>
                        {post.refCategory?.name && (
                            <span className="post-card-category">{post.refCategory.name}</span>
                        )}
                        {post.content && (
                            <p className="post-card-note">{post.content}</p>
                        )}
                    </div>
                </div>
                <div className="post-card-footer">
                    <span className="bubble-time">{getDate(post.createdAt)}</span>
                </div>
            </div>
        </div>
    )
}

const SessionsPanel = ({ sessions, idClassroom, author, addSession }) => {
    const { userAuth } = useContext(AppContext)
    const isTeacher = String(author) === String(userAuth.userId)

    const getPhaseLabel = (phase) => {
        const map = { 1: "Individual writing", 2: "Group discussion", 3: "Consensus writing" }
        return map[phase] || "Unknown"
    }

    const getPhaseColor = (phase) => {
        const map = { 1: "#3B82F6", 2: "#F59E0B", 3: "#10B981" }
        return map[phase] || "#8A8A8A"
    }

    const formatDeadline = (d) => d
        ? new Date(d).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : null
    
    const navigate = useNavigate()

    return (
        <div className="sessions-panel">
            {sessions.length === 0 ? (
                <div className="empty-chat-side">
                    <div className="empty-panel-wrap">
                        <img src={NotFound} alt="no sessions" style={{ height: "150px" }} />
                        <h3>No sessions yet — teacher will launch one soon!</h3>
                    </div>
                </div>
            ) : (
                <div className="sessions-list">
                    {sessions.map(session => (
                        <div key={session._id} className={`session-card ${session.isCompleted ? "session-card-done" : ""}`} onClick={() => navigate(`/classrooms/${idClassroom}/sessions/${session._id}`)}>

                            {/* left accent bar colored by phase */}
                            <div
                                className="session-card-accent"
                                style={{ backgroundColor: session.isCompleted ? "#10B981" : getPhaseColor(session.phase) }}
                            />

                            <div className="session-card-body">
                                {/* header row */}
                                <div className="session-card-header">
                                    <div className="session-card-thumb">
                                        {session.refThumbnail
                                            ? <img src={session.refThumbnail} alt={session.refTitle} />
                                            : <div className="session-card-thumb-fallback">
                                                <i className="ri-file-list-3-line" />
                                            </div>
                                        }
                                    </div>
                                    <div className="session-card-meta">
                                        <span className="session-card-title">{session.refTitle || "Untitled session"}</span>
                                        {session.refCategory?.name && (
                                            <span className="session-card-category">{session.refCategory.name}</span>
                                        )}
                                    </div>
                                    <div className="session-card-status">
                                        {session.isCompleted ? (
                                            <span className="session-badge session-badge-done">
                                                <i className="ri-check-double-line" /> Completed
                                            </span>
                                        ) : (
                                            <span className="session-badge session-badge-live">
                                                <span className="session-live-dot" /> Live
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* phase progress */}
                                {!session.isCompleted && (
                                    <div className="session-phases-row">
                                        {[1, 2, 3].map(p => (
                                            <div
                                                key={p}
                                                className={`session-phase-pip ${p === session.phase ? "pip-active" : p < session.phase ? "pip-done" : "pip-pending"}`}
                                                style={p === session.phase ? { backgroundColor: getPhaseColor(p) } : {}}
                                            >
                                                <span className="pip-label">
                                                    {p < session.phase
                                                        ? <i className="ri-check-line" />
                                                        : `P${p}`
                                                    }
                                                </span>
                                                <span className="pip-desc">{getPhaseLabel(p)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* durations row */}
                                <div className="session-durations-row">
                                    {[1, 2, 3].map(p => (
                                        <span key={p} className="session-duration-chip">
                                            <i className="ri-time-line" />
                                            P{p}: {session.phaseDurations?.[`phase${p}`] ?? 20}m
                                        </span>
                                    ))}
                                    {session.deadline && (
                                        <span className="session-duration-chip session-deadline-chip">
                                            <i className="ri-calendar-line" />
                                            {formatDeadline(session.deadline)}
                                        </span>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="session-card-footer">
                                    <span className="session-created-at">
                                        Started {new Date(session.createdAt).toLocaleDateString([], { day: "numeric", month: "short" })}
                                    </span>
                                    {!session.isCompleted && (
                                        <button
                                            className="session-join-btn"
                                        >
                                            {isTeacher ? "Manage" : "Join"}
                                            <i className="ri-arrow-right-line" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isTeacher && (
                <div className="sessions-fab-row">
                    <button className="sessions-fab" onClick={addSession}>
                        <i className="ri-add-line" />
                        New Session
                    </button>
                </div>
            )}
        </div>
    )
}

export default ClassroomPage
