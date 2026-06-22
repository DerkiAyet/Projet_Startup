import React, { useState, useEffect } from 'react'
import '../Styles/Subjects.css'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as AddIcon } from '../../../Assets/icons/AdminIcons/add.svg'
import axios from 'axios'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import emptyPage from '../../../Assets/images/find-course.png'
import { sub } from 'date-fns'
import { DeleteConfirmPopup } from '../../../Shared/Components/DeletePopup'
import { useNavigate } from 'react-router-dom'
import AddLevel from './AddLevel'

function Subjects() {

  const [searchQuery, setSearchQuery] = useState('');
  const [levels, setLevels] = useState([])

  useEffect(() => {
    axios.defaults.withCredentials = true
    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/game/`)
      .then((res) => setLevels(res.data))
      .catch((err) => console.error(err.response.data))
  }, [])

  const [addLevelOpen, setAddLevelOpen] = useState(false)
  const [levelIdToDelete, setLevelIdToDelete] = useState(null)

  const filteredLevels = levels.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDelete = async(id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL_GATEWAY}/game/${id}`)
      setLevels((prev) => prev.filter((l) => l._id !== id))
      setLevelIdToDelete(null)
    } catch (error) {
      console.error(error.message)
    }
  }

  const navigate = useNavigate();

  return (
    <div className='subjects-container'>
      <div className="subjects-wrapper">
        <div className="subjects-page-header">
          <div className="title-wrapper">
            <h1>System Settings &gt; <span>Levels</span></h1>
            <p>Manage and organize all game levels across the platform.</p>
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
            <button className="add-subject" onClick={() => setAddLevelOpen(true)}>
              <AddIcon />
              Add Level
            </button>
          </div>
        </div>
        <div className="subjects-body">
          <div className="subjects-grid">
            {
              levels.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-wrap">
                    <img src={emptyPage} alt="no chats" style={{ width: "200px" }} />
                    <h3>No levels created yet.</h3>
                  </div>
                </div>
              ) : (
                filteredLevels.map((level) => (
                  <div className="subject-card" onClick={() => navigate(`/settings/levels/${level._id}`)}>
                    <span className="subject-name">{level.name}</span>
                    <img src="" alt="" />
                    <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/game/uploads/${level.coverImg}`} alt="course" />
                    <div className="option-btns">
                      <button className='option-btn'>
                        <EditIcon onClick={(e) => { e.stopPropagation(); console.log('edit') }} />
                      </button>
                      {/* <button className='option-btn' onClick={(e) => { e.stopPropagation(); setLevelIdToDelete(level._id) }}>
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
      {addLevelOpen && <AddLevel onClose={() => setAddLevelOpen(false)} levelAdded={(newLevel) => { setLevels(prev => [...prev, newLevel]); }} />}
      {
        levelIdToDelete && (
          <DeleteConfirmPopup
            title="Delete Level"
            onClose={() => setLevelIdToDelete(null)}
            onDelete={() => handleDelete(levelIdToDelete)}
          />
        )
      }
    </div>
  )
}

export default Subjects
