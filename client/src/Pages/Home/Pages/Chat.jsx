import React, { useState } from 'react';
import '../Styles/Chat.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const conversations = [
    { id: 1, name: 'Emma Johnson',     time: '10:15 AM', preview: "Hey! Just wanted to check if the assignment i...", unread: 2, online: true },
    { id: 2, name: 'Michael Brown',    time: '09:46 AM', preview: 'The webinar was insightful! Thanks for org...',   unread: 0, online: false },
    { id: 3, name: 'Sophia Miller',    time: '08:30 AM', preview: 'Can you clarify the second module topic?',        unread: 3, online: true },
    { id: 4, name: 'James Wilson',     time: 'Yesterday', preview: "I've submitted my final project. Kindly review.", unread: 3, online: false },
    { id: 5, name: 'Olivia Davis',     time: 'Yesterday', preview: "Do we have a recorded session for last week's cl...", unread: 0, online: false },
    { id: 6, name: 'Daniella Jung',    time: 'Mar 6',    preview: "Great! If it still doesn't work, let me know...",  unread: 0, online: true },
    { id: 7, name: 'Mohammed Rodrigues', time: 'Mar 5',  preview: "I'll continue with the course and check my pro...", unread: 0, online: false },
    { id: 8, name: 'Isabella Clark',   time: 'Mar 4',    preview: 'Loved the course! Are there any follow-ups?',     unread: 0, online: false },
    { id: 9, name: 'Liam Harris',      time: 'Mar 4',    preview: 'See you in the next session!',                    unread: 0, online: false },
];

const messages = [
    { id: 1,  senderId: 6, text: "Hey, I'm facing login issues. Any help?",                                                           time: '1:00 PM', read: true },
    { id: 2,  senderId: 0, text: "Hi Daniel! Could you specify the issue? Are you getting an error message?",                         time: '1:02 PM', read: true },
    { id: 3,  senderId: 6, text: "Yeah, it says 'Invalid Credentials' even though my password is correct.",                           time: '1:05 PM', read: true },
    { id: 4,  senderId: 0, text: "Have you tried resetting your password?",                                                            time: '1:07 PM', read: true },
    { id: 5,  senderId: 6, text: "Not yet. I'll try that now.",                                                                        time: '1:10 PM', read: true },
    { id: 6,  senderId: 0, text: "Great! If it still doesn't work, let me know and I'll escalate the issue to support.",              time: '1:12 PM', read: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const Avatar = ({ name, online = false, size }) => (
    <div className="avatar" style={size ? { '--sz': size } : {}}>
        <div className="avatar-placeholder">{initials(name)}</div>
        {online && <span className="online-dot" />}
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
    const [activeId, setActiveId]   = useState(6);
    const [inputVal, setInputVal]   = useState('');
    const [msgList, setMsgList]     = useState(messages);

    const activeConvo = conversations.find(c => c.id === activeId);

    const sendMessage = () => {
        if (!inputVal.trim()) return;
        setMsgList(prev => [...prev, {
            id: prev.length + 1,
            senderId: 0,
            text: inputVal.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
        }]);
        setInputVal('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <div className="chat-app">

            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="search-wrap">
                        <i className="ri-search-line search-icon" />
                        <input type="text" placeholder="Search name, chat, etc" />
                    </div>
                    <button className="new-chat-btn">
                        <i className="ri-add-line" />
                    </button>
                </div>

                <div className="convo-list">
                    {conversations.map(convo => (
                        <div
                            key={convo.id}
                            className={`convo-item ${activeId === convo.id ? 'active' : ''}`}
                            onClick={() => setActiveId(convo.id)}
                        >
                            <Avatar name={convo.name} online={convo.online} />
                            <div className="convo-info">
                                <div className="convo-top">
                                    <span className="convo-name">{convo.name}</span>
                                    <span className="convo-time">{convo.time}</span>
                                </div>
                                <div className="convo-bottom">
                                    <span className="convo-preview">{convo.preview}</span>
                                    {convo.unread > 0 && (
                                        <span className="unread-badge">{convo.unread}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Chat Panel ── */}
            <section className="chat-panel">

                {/* Header */}
                <div className="chat-header">
                    <Avatar name={activeConvo.name} online={activeConvo.online} />
                    <div className="chat-header-info">
                        <div className="chat-header-name">{activeConvo.name}</div>
                        <div className="chat-header-status">
                            {activeConvo.online ? 'Online' : 'Last seen recently'}
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button className="header-icon-btn"><i className="ri-vidicon-line" /></button>
                        <button className="header-icon-btn"><i className="ri-phone-line" /></button>
                        <button className="header-icon-btn"><i className="ri-more-fill" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="messages-area">
                    <div className="date-divider"><span>March 6, 2028</span></div>

                    {msgList.map(msg => {
                        const isSent = msg.senderId === 0;
                        return (
                            <div key={msg.id} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                                {!isSent && <Avatar name={activeConvo.name} />}
                                <div className="bubble">
                                    {msg.text}
                                    <div className="bubble-meta">
                                        <span className="bubble-time">{msg.time}</span>
                                        {isSent && (
                                            <span className="read-ticks">
                                                {msg.read ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <div className="chat-input-bar">
                    <div className="chat-input-wrap">
                        <button className="input-icon-btn"><i className="bx bx-smile" /></button>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            onKeyDown={handleKey}
                        />
                        <button className="input-icon-btn"><i className="ri-attachment-2" /></button>
                    </div>
                    <button className="send-btn" onClick={sendMessage}>
                        <i className="ri-send-plane-fill" />
                    </button>
                </div>

            </section>
        </div>
    );
}