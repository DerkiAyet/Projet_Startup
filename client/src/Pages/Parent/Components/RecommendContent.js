import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import '../Styles/RecommendContent.css'
import { ReactComponent as CloseIcon } from '../../../Assets/icons/TimelineIcons/close.svg'

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

const RecommendContent = ({ itemRef, onClose, contentType, content, addSucess }) => {

    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('')

    const filteredChildren = children.filter((child) =>
        child.familyName.toLowerCase().includes(query.toLowerCase()) ||
        child.givenName.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/get-children`, { timeout: 5000 })
                setChildren(res.data)
            } catch (error) {
                console.error("error:", error)
            }
        }

        fetchChildren()
    }, [])

    const [selectedChildIds, setSelectedChildrenIds] = useState([])

    const handleRecommend = async () => {
        setLoading(true)
        try {
            if (selectedChildIds.length === 0) return alert("select at least one student")

            await Promise.all( // Promise.all never works with forEach 
                selectedChildIds.map(async (childId) => {
                    await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/recommendations`,
                        {
                            studentId: childId,
                            contentId: content?._id,
                            contentType: contentType,
                            contentTitle: content?.title,
                            categoryId: content?.category?.idSubject,
                            subCategoryId: content?.subCategory?.idSub,
                        }, {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })
                })
            )
            addSucess()
            onClose()
        } catch (error) {
            console.error("error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (childId) => {
        setSelectedChildrenIds(prev =>
            prev.includes(childId)
                ? prev.filter((id) => id !== childId)
                : [...prev, childId]
        )
    }

    return (
        <div className='rc-overlay'>
            <div className="rc-container" ref={itemRef}>
                <div className="rc-header">
                    <h3>Suggest it for your child</h3>
                    <CloseIcon onClick={onClose} />
                </div>
                <div className="rc-body">
                    <div className="search-wrap">
                        <i className="ri-search-line search-icon" />
                        <input
                            type="text"
                            placeholder="Search for your child"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ color: "#000" }}
                        />
                    </div>
                    <div className="already-know" style={{ alignSelf: 'flex-start', padding: '0 1rem', width: '100%' }}>
                        <div style={{ borderBottom: '1.2px solid #A6A6A6', width: '100%', paddingBottom: '3px', fontSize: '0.8rem' }}>
                            Your lovely children ~
                        </div>
                    </div>
                    <div className="search-result-wrap">
                        {filteredChildren.map((child) => {
                            const isSelected = selectedChildIds.some(c => c === child.userId);
                            return (
                                < div
                                    key={child.userId}
                                    className="child-item"
                                    onClick={() => handleSelect(child.userId)}
                                >
                                    <Avatar name={`${child.givenName} ${child.familyName}`} />
                                    <div className="child-info">
                                        <div className="child-top">
                                            <span className="child-name">{`${child.givenName} ${child.familyName}`}</span>
                                            {isSelected && <i className="ri-checkbox-circle-fill" style={{ color: '#EC4899' }} />}
                                        </div>
                                        <div className="child-bottom">
                                            <span className="child-preview" style={{ textTransform: 'capitalize' }}>
                                                Student
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <button
                        className="send-btn"
                        style={{ marginTop: '0.75rem', borderRadius: '8px', padding: '0.6rem', alignSelf: "flex-end", width: "auto", marginRight: "1rem", fontFamily: "'Kumbh Sans', sans-serif", fontWeight: "600" }}
                        onClick={handleRecommend}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : `Send (${selectedChildIds.length})`}
                    </button>
                </div>
            </div>
        </div >
    )
}

export default RecommendContent
