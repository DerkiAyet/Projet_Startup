import React, { useState, useEffect } from 'react'
import '../Styles/Subjects.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as AddIcon } from '../../../Assets/icons/AdminIcons/add.svg'
import axios from 'axios'
import AddSubject from './AddSubject'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import { sub } from 'date-fns'
import { DeleteConfirmPopup } from '../../../Shared/Components/DeletePopup'
import { useNavigate } from 'react-router-dom'
import emptyPage from '../../../Assets/images/find-course.png'

function Subjects() {

    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([])

    useEffect(() => {
        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/infos/get-subjects`)
            .then((res) => setCategories(res.data))
            .catch((err) => console.error(err.response.data))
    }, [])

    const [addSubjectOpen, setAddSubjectOpen] = useState(false)
    const [subjectIdToDelete, setSubjectIdToDelete] = useState(null)

    const filteredCategories = categories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const handleDelete = (id) => {
        console.log(`Delete subject with ID: ${id}`);
    }

    const navigate = useNavigate();

    return (
        <div className='subjects-container'>
            <div className="subjects-wrapper">
                <div className="subjects-page-header">
                    <div className="title-wrapper">
                        <h1>System Settings &gt; <span>Subjects</span></h1>
                        <p>Manage and organize all course subjects across the platform.</p>
                    </div>
                    <div className="header-flex-right">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder='Search by title...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <SearchIcon />
                        </div>
                        <button className="add-subject" onClick={() => setAddSubjectOpen(true)}>
                            <AddIcon />
                            Add Subject
                        </button>
                    </div>
                </div>
                <div className="subjects-body">
                    <div className="subjects-grid">
                        {
                            categories.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-wrap">
                                        <img src={emptyPage} alt="no chats" style={{ width: "200px" }} />
                                        <h3>No Subjects created yet.</h3>
                                    </div>
                                </div>
                            ) :
                                (
                                    filteredCategories.map((cat) => (
                                        <div className="subject-card" onClick={() => navigate(`/settings/subjects/${cat.idSubject}`)}>
                                            <span className="subject-name">{cat.name}</span>
                                            <img src="" alt="" />
                                            <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${cat.subImg}`} alt="course" />
                                            <div className="option-btns">
                                                <button className='option-btn' onClick={(e) => { e.stopPropagation() }}>
                                                    <EditIcon />
                                                </button>
                                                {/* <button className='option-btn' onClick={(e) => { e.stopPropagation(); setSubjectIdToDelete(cat.idSubject) }}>
                                                    <DeleteIcon />
                                                </button> */}
                                            </div>
                                        </div>
                                    ))
                                )
                        }

                    </div>
                </div>
            </div>
            {addSubjectOpen && <AddSubject onClose={() => setAddSubjectOpen(false)} subjectAdded={(newSubject) => { setCategories(prev => [...prev, newSubject]); }} />}
            {
                subjectIdToDelete && (
                    <DeleteConfirmPopup
                        title="Delete Subject"
                        onClose={() => setSubjectIdToDelete(null)}
                        onDelete={() => handleDelete(subjectIdToDelete)}
                    />
                )
            }
        </div>
    )
}

export default Subjects
