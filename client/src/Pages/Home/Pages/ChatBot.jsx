import React, { useState, useRef, useEffect, useContext } from 'react'
import '../Styles/ChatBot.css'
import { ReactComponent as AiIcon } from '../../../Assets/icons/NavIcons/assistant-ai.svg';
import { AppContext } from '../../../App';

const getMessage = (userRole) => {
    switch (userRole) {
        case "student":
            return "Hi! 👋 I'm your learning assistant. Feel free to ask me questions, explore new topics, or get help with your studies.\nWhat's on your mind today?";
        case "teacher":
            return "Hi! 👋 I'm here to support your teaching journey.\nAsk me about lesson ideas, educational resources, or anything else you need help with.";
        case "parent":
            return "Hi! 👋 I'm here to help you support your child's learning.\nFeel free to ask questions, explore resources, or seek educational guidance.";
        default:
            return "Anonymous";
    }
}

function ChatBot() {
    const { userAuth } = useContext(AppContext)
    const userRole = userAuth.role

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: getMessage(userRole)
        }
    ])
    const [inputVal, setInputVal] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [streamingText, setStreamingText] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const bodyRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        }
    }, [messages, streamingText])

    const sendMessage = async () => {
        const text = inputVal.trim()
        if (!text || isLoading || isStreaming) return

        const userMsg = { role: 'user', content: text }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInputVal('')
        setIsStreaming(true)
        setStreamingText('')

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL_GATEWAY}/chatbot/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: text,
                    history: messages.slice(-10),
                    userRole
                })
            })

            if (!response.ok) throw new Error('Service unavailable')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullReply = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.replace('data: ', '').trim()
                        if (data === '[DONE]') break
                        try {
                            const { token } = JSON.parse(data)
                            fullReply += token
                            setStreamingText(fullReply)
                        } catch { }
                    }
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: fullReply }])
            setStreamingText('')
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }
            ])
            setStreamingText('')
        } finally {
            setIsStreaming(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: "Hi! I'm your academic assistant 👋 Ask me anything about your courses, assignments, or studies!"
        }])
    }

    return (
        <div className='chatbot-container'>
            <div className="chatbot-wrapper">

                <div className="chatbot-header">
                    <div className="avatar">
                        <AiIcon />
                    </div>
                    <div className="chat-header-info">
                        <div className="chat-header-name">Academic Assistant</div>
                        <div className="chat-header-status">
                            {isStreaming ? (
                                <span className="typing-status">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    Typing
                                </span>
                            ) : 'Online'}
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button
                            className="header-icon-btn"
                            onClick={clearChat}
                            title="Clear conversation"
                        >
                            <i className="ri-delete-bin-line" />
                        </button>
                        <button className="header-icon-btn">
                            <i className="ri-more-fill" />
                        </button>
                    </div>
                </div>

                <div className="chatbot-body" ref={bodyRef}>
                    <div className="messages-list">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`message-row ${msg.role === 'user' ? 'user-row' : 'bot-row'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="bot-avatar">
                                        <AiIcon />
                                    </div>
                                )}
                                <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isStreaming && streamingText && (
                            <div className="message-row bot-row">
                                <div className="bot-avatar">
                                    <AiIcon />
                                </div>
                                <div className="message-bubble bot-bubble streaming">
                                    {streamingText}
                                    <span className="cursor-blink">|</span>
                                </div>
                            </div>
                        )}

                        {isStreaming && !streamingText && (
                            <div className="message-row bot-row">
                                <div className="bot-avatar">
                                    <AiIcon />
                                </div>
                                <div className="message-bubble bot-bubble">
                                    <div className="thinking-dots">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="chat-input-bar">
                    <div className="chat-input-wrap">
                        <button className="input-icon-btn"><i className="bx bx-smile" /></button>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask me anything academic..."
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={isStreaming}
                        />
                        <button className="input-icon-btn"><i className="ri-attachment-2" /></button>
                    </div>
                    <button
                        className={`send-btn ${(!inputVal.trim() || isStreaming) ? 'send-btn-disabled' : ''}`}
                        onClick={sendMessage}
                        disabled={!inputVal.trim() || isStreaming}
                    >
                        {isStreaming
                            ? <i className="ri-loader-4-line spin" />
                            : <i className="ri-send-plane-fill" />
                        }
                    </button>
                </div>

            </div>
        </div>
    )
}

export default ChatBot