import React, { useState, useRef, useEffect } from 'react';
import '../Styles/Chat.css';
import { useSocket } from "../../../Utilities/config/useSocket"
import axios from "axios"
import { useContext } from 'react';
import { AppContext } from '../../../App';
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'
import { ReactComponent as PeopleIcon } from '../../../Assets/icons/NavIcons/people.svg';
import { ReactComponent as ProfileIcon } from '../../../Assets/icons/NavIcons/profile.svg';
import emptyChats from '../../../Assets/images/no-chats.png'
import startChat from '../../../Assets/images/chat.png'


// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {

    const { userAuth } = useContext(AppContext)

    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputVal, setInputVal] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const prevConvoIdRef = useRef(null);
    const typingTimerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchInitialUsers = async () => {
            try {
                const followersRes = await axios.get(
                    `${process.env.REACT_APP_API_URL_GATEWAY}/posts/get-followers`
                );
                const followers = followersRes.data.followers;

                let combined = [...followers];

                try {
                    const followeesRes = await axios.get(
                        `${process.env.REACT_APP_API_URL_GATEWAY}/posts/get-followees`
                    );
                    const followees = followeesRes.data.followees;

                    combined = [...combined, ...followees];

                    // ✅ Remove duplicates by user._id
                    const uniqueUsers = Array.from(
                        new Map(combined.map((user) => [user.id, user]))
                    ).map(([_, user]) => user);

                    setUsers(uniqueUsers);
                } catch (error) {
                    console.error("error while fetching followees", error);
                }

            } catch (error) {
                console.error("error while fetching followers", error);
            }
        };

        fetchInitialUsers();
    }, []);

    const socket = useSocket()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const conversationsData = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/notifications/conversations/my-conversations`)
                setConversations(conversationsData.data);
            } catch (error) {
                console.error('Failed to load conversations:', error)
            }
        }
        fetchData()
    }, []);

    // useEffect for charging the conversation we selected
    useEffect(() => {
        if (!activeConvo || !socket) return;

        const conversationId = activeConvo._id;

        // leave previous conversation room
        if (prevConvoIdRef.current && prevConvoIdRef.current !== conversationId) {
            socket.emit('close_conversation', { conversationId: prevConvoIdRef.current });
        }

        // join new conversation room
        socket.emit('open_conversation', { conversationId });
        prevConvoIdRef.current = conversationId;

        // mark messages as read
        axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/notifications/messages/${conversationId}/read`, {}, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .catch(console.error);

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/notifications/messages/${conversationId}/messages`)
            .then(r => setMessages(r.data))
            .catch(err => console.error('Failed to load messages:', err.response.data));

        return () => {
            socket.emit('close_conversation', { conversationId });
        };
    }, [activeConvo, socket]);


    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", ({ conversationId, message }) => {
            if (activeConvo?._id === conversationId) setMessages((prev) => [...prev, message])
            // change the last message of that conversation (because it's shown in the panel)
            setConversations(prev =>
                prev.map(c =>
                    c._id === conversationId
                        ? { ...c, lastMessage: message }
                        : c
                )
            );
        });

        // inform the current user that their message has been sent
        socket.on("message_sent", ({ conversationId, message }) => {
            setMessages((prev) => [...prev, message])
        })

        // additionals: tell if a user is typing
        socket.on("user_typing", ({ userId }) => {
            if (userId !== activeConvo?.members?.find(m => m.userId === userId)?.userId) return; // makes sure he is a member of the current conversation
            setIsTyping(true);
        })

        socket.on('user_stop_typing', () => {
            setIsTyping(false);
        });

        return () => {
            socket.off("receive_message");
            socket.off("message_sent");
            socket.off("user_typing");
            socket.off("user_stop_typing")
        };
    }, [socket, activeConvo])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // scroll to the latest message by default

    const sendMessage = async () => {

        try {
            if (!inputVal.trim() || !activeConvo || !socket) return;

            await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/notifications/messages/${activeConvo._id}`, { content: inputVal.trim() }, {
                headers: {
                    "Content-Type": "application/json"
                }
            })

            socket.emit('send_message', {
                conversationId: activeConvo._id,
                content: inputVal.trim()
            });

            // stop typing indicator
            socket.emit('stop_typing', { conversationId: activeConvo._id });
            clearTimeout(typingTimerRef.current);

            setInputVal('');
        } catch (error) {
            console.error("error while sending the message", error)
        }

    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleTyping = (e) => {
        setInputVal(e.target.value);

        if (!socket || !activeConvo) return;

        socket.emit('typing', { conversationId: activeConvo._id });

        // stop typing after 2 seconds of inactivity
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit('stop_typing', { conversationId: activeConvo._id });
        }, 2000);
    };

    const handleSelectConvo = (convo) => {
        if (convo._id === activeConvo?._id) return; // already open
        setMessages([]); // clear messages while loading new ones
        setActiveConvo(convo);
    };

    const getConvoName = (convo) => { // this is help because we have two types of conv: group or direct
        if (convo?.isGroup) return convo.title;
        const myId = userAuth.userId
        const other = convo?.members?.find(m => String(m.userId) !== String(myId));
        return other ? `${other.givenName} ${other.familyName}` : 'Unknown';
    };

    const getConvoImg = (convo) => {
        if (convo?.isGroup) return null;
        const myId = userAuth.userId
        const other = convo?.members?.find(m => String(m.userId) !== String(myId));
        return other?.userImg
    }

    const getLastMessagePreview = (convo) => {
        if (!convo.lastMessage) return 'No messages yet';
        const content = convo.lastMessage.content || '';
        return content.length > 40 ? content.slice(0, 40) + '...' : content;
    };

    const [addClicked, setAddClicked] = useState(false)
    const addRef = useRef('')
    const newContactRef = useRef('')
    const newGroupRef = useRef('')

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (addRef.current && !addRef.current.contains(event.target)) {
                setAddClicked(false);
            }

            if (newContactRef.current && !newContactRef.current.contains(event.target)) {
                setNewContactClicked(false);
            }

            if (newGroupRef.current && !newGroupRef.current.contains(event.target)) {
                setNewGroupClicked(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    const [newContactClicked, setNewContactClicked] = useState(false)
    const [newGroupClicked, setNewGroupClicked] = useState(false)

    const handleConvoCreated = (newConvo) => {
        setConversations(prev =>
            prev.find(c => c._id === newConvo._id) ? prev : [newConvo, ...prev]
        );
        setActiveConvo(newConvo);
    }

    const [showMembersPanel, setShowMembersPanel] = useState(false);

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/conversations/${activeConvo._id}/leave`
            );
            setConversations(prev => prev.filter(c => c._id !== activeConvo._id));
            setActiveConvo(null);
            setShowMembersPanel(false);
        } catch (err) {
            console.error('Failed to leave group:', err);
        }
    };

    const handleBack = () => {
        setActiveConvo(null);
    };

    return (
        <div className="chat-app">

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${activeConvo ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="search-wrap">
                        <i className="ri-search-line search-icon" />
                        <input type="text" placeholder="Search name, chat, etc" />
                    </div>
                    <button className="new-chat-btn" onClick={() => setAddClicked((prev) => !prev)}>
                        <i className="ri-add-line" />
                        {addClicked && <ul className='add-options' ref={addRef} >
                            <li onClick={(e) => { e.stopPropagation(); setNewContactClicked(true); setAddClicked(false) }}>
                                <div className="icon-wrap"> <ProfileIcon /> </div>
                                New Contact
                            </li>
                            <li onClick={(e) => { e.stopPropagation(); setNewGroupClicked(true); setAddClicked(false) }}>
                                <div className="icon-wrap"> <PeopleIcon /> </div>
                                New Group
                            </li>
                        </ul>}
                    </button>
                </div>

                <div className="convo-list">
                    {
                        conversations.length === 0 &&
                        <div className="empty-state">
                            <div className="empty-wrap">
                                <img src={emptyChats} alt="no chats" style={{ width: "200px" }} />
                                <h3>Looks a bit quiet here — Say hi to someone!</h3>
                            </div>
                        </div>
                    }
                    {conversations.map(convo => (
                        <div
                            key={convo.id}
                            className={`convo-item ${activeConvo?._id === convo?._id ? 'active' : ''}`}
                            onClick={() => handleSelectConvo(convo)}
                        >
                            <Avatar name={getConvoName(convo)} pic={getConvoImg(convo)} />
                            <div className="convo-info">
                                <div className="convo-top">
                                    <span className="convo-name">{getConvoName(convo)}</span>
                                    <span className="convo-time">
                                        {convo.lastMessage
                                            ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : ''}
                                    </span>
                                </div>
                                <div className="convo-bottom">
                                    <span className="convo-preview">
                                        {getLastMessagePreview(convo)}
                                    </span>
                                    {/* {convo.unread > 0 && (
                                        <span className="unread-badge">{convo.unread}</span>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Chat Panel ── */}
            <section className="chat-panel">

                {
                    !activeConvo ?
                        <div className='empty-chat-side'>
                            <div className="empty-panel-wrap">
                                <img src={startChat} alt="start chat" style={{ height: "150px" }} />
                                <h3>This space is waiting for a story — start a chat!</h3>
                            </div>
                        </div> :
                        <>
                            <div className="chat-header">
                                <button
                                    className="header-icon-btn back-btn"
                                    onClick={handleBack}
                                    style={{ display: 'none' }}
                                >
                                    <i className="ri-arrow-left-line" />
                                </button>
                                <Avatar name={getConvoName(activeConvo)} pic={getConvoImg(activeConvo)} />
                                <div className="chat-header-info">
                                    <div className="chat-header-name">{getConvoName(activeConvo)}</div>
                                    <div className="chat-header-status">
                                        {isTyping ? 'Typing...' : 'Online'}
                                    </div>
                                </div>
                                <div className="chat-header-actions">
                                    <button className="header-icon-btn" style={{ color: "#000" }} onClick={() => setShowMembersPanel(p => !p)}>
                                        <i className="ri-more-fill" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="messages-area">
                                {messages.map(msg => {
                                    const isSent = String(msg.senderId) === String(userAuth.userId);
                                    const senderName = msg.senderInfo
                                        ? `${msg.senderInfo.givenName} ${msg.senderInfo.familyName}`
                                        : getConvoName(activeConvo);
                                    const senderProfile = msg.senderInfo
                                        ? msg.senderInfo.userImg
                                        : getConvoImg(activeConvo);

                                    return (
                                        <div key={msg._id} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                                            {!isSent && (
                                                <div className="msg-avatar-wrap">
                                                    <Avatar name={senderName} pic={senderProfile} />
                                                    {activeConvo.isGroup && (
                                                        <span className="msg-sender-name">{msg.senderInfo?.givenName ?? ''}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="bubble">
                                                {msg.content}
                                                <div className="bubble-meta">
                                                    <span className="bubble-time">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isSent && (
                                                        <span className="read-ticks">
                                                            {msg.readBy?.length > 1 ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="chat-input-bar">
                                <div className="chat-input-wrap">
                                    <button className="input-icon-btn"><i className="bx bx-smile" /></button>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={inputVal}
                                        onChange={handleTyping}
                                        onKeyDown={handleKey}
                                    />
                                    <button className="input-icon-btn"><i className="ri-attachment-2" /></button>
                                </div>
                                <button className="send-btn" onClick={sendMessage}>
                                    <i className="ri-send-plane-fill" />
                                </button>
                            </div>
                            {showMembersPanel && (
                                <div className="members-panel">
                                    <div className="members-panel-header">
                                        <span className="members-panel-title">
                                            {activeConvo.isGroup ? `Members (${activeConvo.members?.length})` : 'Contact Info'}
                                        </span>
                                        <button className="header-icon-btn" onClick={() => setShowMembersPanel(false)}>
                                            <CloseIcon />
                                        </button>
                                    </div>

                                    <div className="members-list">
                                        {activeConvo.members?.map((member) => (
                                            <div key={member.userId} className="member-row">
                                                <Avatar name={`${member.givenName} ${member.familyName}`} />
                                                <div className="member-info">
                                                    <span className="member-name">
                                                        {member.givenName} {member.familyName}
                                                        {String(member.userId) === String(userAuth.userId) && (
                                                            <span className="member-you-tag">you</span>
                                                        )}
                                                    </span>
                                                    <span className="member-username">@{member.userName}</span>
                                                </div>
                                                {member.role === 'admin' && (
                                                    <span className="member-admin-badge">Admin</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="members-panel-footer">
                                        <button className="leave-group-btn" onClick={handleLeaveGroup}>
                                            <i className="ri-logout-box-r-line" />
                                            Leave Conversation
                                        </button>
                                    </div>

                                </div>
                            )}
                        </>
                }

            </section>
            {newContactClicked && (
                <NewContact
                    onClose={() => setNewContactClicked(false)}
                    itemRef={newContactRef}
                    users={users}
                    onConvoCreated={handleConvoCreated}
                />
            )}
            {newGroupClicked && (
                <NewGroup
                    onClose={() => setNewGroupClicked(false)}
                    itemRef={newGroupRef}
                    users={users}
                    onConvoCreated={handleConvoCreated}
                />
            )}
        </div>
    );
}

const NewContact = ({ onClose, itemRef, users, onConvoCreated }) => {
    const [resultSearch, setResultSearch] = useState(users);
    const [query, setQuery] = useState('');
    const [loadingId, setLoadingId] = useState(null);
    const { userAuth } = useContext(AppContext)

    const handleSearch = async (e) => {
        try {
            if (!query.trim()) return alert('enter a valid name')
            const params = new URLSearchParams();
            params.set("q", query.toLocaleLowerCase())

            const request = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/search?${params.toString()}`)
            setResultSearch(request.data.users)

        } catch (error) {
            console.error('error while searching for users', error)
        }

    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleStartChat = async (targetUserId, selectedUser) => {
        setLoadingId(targetUserId);
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/conversations/create-direct`,
                { targetUserId },
                { headers: { 'Content-Type': 'application/json' } }
            );
            const newConversation = {
                _id: data._id,
                title: null,
                isGroup: false,
                members: [
                    {
                        userId: userAuth.userId,
                        role: "admin",
                        userName: userAuth.userName,
                        givenName: userAuth.givenName,
                        familyName: userAuth.familyName
                    },
                    {
                        userId: selectedUser.id,
                        role: "member",
                        userName: selectedUser.userName,
                        givenName: selectedUser.givenName,
                        familyName: selectedUser.familyName
                    }
                ],
                lastMessage: null,
            }
            onConvoCreated(newConversation); // set as activeConvo + add to list
            onClose();
        } catch (err) {
            console.error('Failed to create direct conversation:', err);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="nc-overlay">
            <div className="nc-container" ref={itemRef}>
                <div className="nc-header">
                    <h3>New Contact</h3>
                    <CloseIcon onClick={onClose} />
                </div>
                <div className="nc-body">
                    <div className="search-wrap">
                        <i className="ri-search-line search-icon" />
                        <input
                            type="text"
                            placeholder="Search by username, name, etc"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKey}
                            style={{ color: "#000" }}
                        />
                    </div>
                    <div className="already-know" style={{ alignSelf: 'flex-start', padding: '0 1rem', width: '100%' }}>
                        <div style={{ borderBottom: '1.2px solid #A6A6A6', width: '100%', paddingBottom: '3px', fontSize: '0.8rem' }}>
                            People you may know ~
                        </div>
                    </div>
                    <div className="search-result-wrap">
                        {resultSearch.map((user) => (
                            <div
                                key={user.id}
                                className="convo-item"
                                onClick={() => handleStartChat(user.id, user)}
                                style={{ cursor: loadingId === user.id ? 'wait' : 'pointer' }}
                            >
                                <Avatar name={`${user.givenName} ${user.familyName}`} />
                                <div className="convo-info">
                                    <div className="convo-top">
                                        <span className="convo-name">{`${user.givenName} ${user.familyName}`}</span>
                                    </div>
                                    <div className="convo-bottom">
                                        <span className="convo-preview" style={{ textTransform: 'capitalize' }}>
                                            {loadingId === user.id ? 'Opening chat...' : user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewGroup = ({ onClose, itemRef, users, onConvoCreated }) => {
    const [resultSearch, setResultSearch] = useState(users);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState([]);    // array of user objects
    const [groupTitle, setGroupTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        try {
            if (!query.trim()) return alert('enter a valid name')
            const params = new URLSearchParams();
            params.set("q", query.toLocaleLowerCase())

            const request = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/search?${params.toString()}`)
            setResultSearch(request.data.users)

        } catch (error) {
            console.error('error while searching for users', error)
        }

    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const toggleSelect = (user) => {
        setSelected(prev =>
            prev.find(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupTitle.trim()) return alert('Please enter a group name');
        if (selected.length < 2) return alert('Select at least 2 members');

        setLoading(true);
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL_GATEWAY}/notifications/conversations/create-groupe`,
                {
                    title: groupTitle.trim(),
                    membersIds: selected.map(u => u.id)
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            onConvoCreated(data);
            onClose();
        } catch (err) {
            console.error('Failed to create group:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nc-overlay">
            <div className="nc-container" ref={itemRef}>
                <div className="nc-header">
                    <h3>Add Members</h3>
                    <CloseIcon onClick={onClose} />
                </div>
                <div className="nc-body">
                    <div className="search-wrap">
                        <i className="ri-group-line search-icon" />
                        <input
                            type="text"
                            placeholder="Group name"
                            value={groupTitle}
                            onChange={e => setGroupTitle(e.target.value)}
                        />
                    </div>

                    {/* Selected chips */}
                    {selected.length > 0 && (
                        <div className="selected-chips">
                            {selected.map(u => (
                                <span key={u.id} className="chip">
                                    <div className="chip-avatar">
                                        {initials(`${u.givenName} ${u.familyName}`)}
                                    </div>
                                    <button className='chip-delete' onClick={() => toggleSelect(u)}><CloseIcon /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="already-know" style={{ alignSelf: 'flex-start', padding: '0 1rem', width: '100%' }}>
                        <div style={{ borderBottom: '1.2px solid #A6A6A6', width: '100%', paddingBottom: '3px', fontSize: '0.8rem' }}>
                            People you may know ~
                        </div>
                    </div>

                    {/* Search */}
                    <div className="search-wrap">
                        <i className="ri-search-line search-icon" />
                        <input
                            type="text"
                            placeholder="Search by username, name, etc"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKey}
                        />
                    </div>

                    <div className="search-result-wrap">
                        {resultSearch.map((user) => {
                            const isSelected = selected.some(u => u.id === user.id);
                            return (
                                <div
                                    key={user.id}
                                    className={`convo-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => toggleSelect(user)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Avatar name={`${user.givenName} ${user.familyName}`} />
                                    <div className="convo-info">
                                        <div className="convo-top">
                                            <span className="convo-name">{`${user.givenName} ${user.familyName}`}</span>
                                            {isSelected && <i className="ri-checkbox-circle-fill" style={{ color: '#EC4899' }} />}
                                        </div>
                                        <div className="convo-bottom">
                                            <span className="convo-preview" style={{ textTransform: 'capitalize' }}>{user.role}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="send-btn"
                        style={{ marginTop: '0.75rem', borderRadius: '8px', padding: '0.6rem', alignSelf: "flex-end", width: "auto", marginRight: "1rem", fontFamily: "'Kumbh Sans', sans-serif", fontWeight: "600" }}
                        onClick={handleCreateGroup}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : `Create Group (${selected.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};