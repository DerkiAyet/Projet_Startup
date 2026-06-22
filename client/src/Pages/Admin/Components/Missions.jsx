import React, { useEffect, useState } from 'react'
import '../Styles/Specialities.css'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import doneImg from "../../../Assets/images/done.png"
import { DeleteConfirmPopup } from '../../../Shared/Components/DeletePopup'

const missionTypes = [
    {
        value: "PUBLISH_POST",
        msg: "Publish Post"
    },
    {
        value: "NEW_FOLLOWEE",
        msg: "Follow a User"
    },
    {
        value: "NEW_FOLLOWER",
        msg: "Gain a Follower"
    },
    {
        value: "ENROLL_COURSE",
        msg: "Enroll in a Course"
    },
    {
        value: "SOLVE_QUIZ",
        msg: "Solve a Quiz"
    },
    {
        value: "SEND_SOLUTION",
        msg: "Submit a Solution"
    },
    {
        value: "GET_GRADE",
        msg: "Receive a Grade"
    },
    {
        value: "PARTICIPATE_CLASSROOM",
        msg: "Participate in a Classroom"
    },
    {
        value: "DO_HOMEWORK",
        msg: "Complete Homework"
    },
    {
        value: "PARTICPATE_SESSION",
        msg: "Participate in a Session"
    },
    {
        value: "SHARE_RESSOURCE",
        msg: "Share a Resource"
    }
];

function Missions() {
    const { levelId } = useParams();

    const [missions, setMissions] = useState([]);
    const [level, setLevel] = useState({})

    useEffect(() => {

        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/game/${levelId}`)
            .then((res) => {
                setLevel(res.data)
                setMissions(res.data.missions)
            })
            .catch((err) => console.error(err.response.data))

    }, [levelId])

    const [searchQuery, setSearchQuery] = useState('')

    const [newMission, setNewMission] = useState({
        type: "",
        toDo: 0
    });
    const [selectedMission, setSelectedMission] = useState(0)

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            const res = await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/game/${levelId}/missions`, newMission, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            setMissions((prev) => [...prev, res.data])
            setNewMission({
                type: "",
                toDo: 0
            })
        } catch (error) {
            console.error(error.message)
        }

    }

    const [missionToModify, setMissionToModify] = useState({
        _id: null,
        type: "",
        toDo: 0
    });

    const handlemodifie = async (e) => {
        e.preventDefault()
        try {
            if (missionToModify._id) {
                const res = await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/game/${levelId}/missions/${missionToModify._id}`, missionToModify, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                })

                setMissions((prev) =>
                    prev.map((s) =>
                        s._id === missionToModify._id ? { ...s, type: res.data.type, toDo: res.data.toDo }
                            : s
                    )
                )

                setModifieClicked(false)       // ← reset
                setConfirmModifie(false)

                alert("modifie avec succes")
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const [modifieClicked, setModifieClicked] = useState(false);
    const [confirmModifie, setConfirmModifie] = useState(false);

    const annulerModifier = (e) => {
        e.preventDefault()
        setModifieClicked(false);
        setMissionToModify({
            _id: null,
            type: "",
            toDo: 0
        });
        setNewMission({
            type: "",
            toDo: 0
        })
        setConfirmModifie(false)
    }

    const [idMissionToDelete, setIdMissionToDelete] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = async () => {
        try {
            if (idMissionToDelete) {
                await axios.delete(`${process.env.REACT_APP_API_URL_GATEWAY}/game/${levelId}/missions/${idMissionToDelete}`)
                setMissions((prev) =>
                    prev.filter((s, idx) => s._id !== idMissionToDelete)
                )
            }
            annulerDelete();
        } catch (error) {
            console.error(error.message)
        }

    }

    const annulerDelete = () => {
        setIdMissionToDelete(null)
        setNewMission({
            type: "",
            toDo: 0
        })
        setConfirmDelete(false)
    }

    const [focusedInput, setFocusedInput] = useState(null);

    return (
        <div className='specs-container'>
            <div className="specs-wrapper">
                <div className="specs-page-header">
                    <div className="title-wrapper">
                        <h1>System Settings &gt;<span><Link className='link' to='/settings/levels'>Levels</Link></span>&gt; {level.name} &gt; <span> Missions</span></h1>
                        <p>Manage and organize all system game levels across the platform.</p>
                    </div>
                    <div className="header-flex-right">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder='Search by type...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <SearchIcon />
                        </div>
                    </div>
                </div>

                <div
                    className="formSpec-container"
                >
                    <h1 style={{ fontSize: "1.85rem", color: "#000", fontWeight: "500" }}>
                        Missions
                    </h1>
                    <p style={{ color: "#5F5F5F", fontSize: "1.1rem", fontFamily: "Nunito, sans serif", width: "630px" }}>
                        Manage the missions connected to this level.
                    </p>
                    <div
                        className="form-table-container"
                    >
                        <form action="">
                            <div
                                className="select-scolarite-line common-input"
                                style={{
                                    flex: 1,
                                    border: focusedInput === "type" ? "2px solid #F29DB6" : "2px solid #D9E1E7"
                                }}

                            >
                                <select
                                    type="text"
                                    className='select-input'
                                    onFocus={() => setFocusedInput("type")}
                                    onBlur={() => setFocusedInput(null)}
                                    value={missionToModify._id !== null ? missionToModify.type : newMission.type}
                                    onChange={(e) => {
                                        if (missionToModify?._id !== null) {
                                            setMissionToModify({ ...missionToModify, type: e.target.value });
                                        } else {
                                            setNewMission({ ...newMission, type: e.target.value });
                                        }
                                    }}
                                >
                                    <option value="default">Types</option>
                                    {
                                        missionTypes.map((t) => (
                                            <option value={t.value}>{t.msg}</option>
                                        ))
                                    }
                                </select>
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"

                                >
                                    <path d="M4.99929 4.18863L8.77899 0.220677C8.91347 0.0793351 9.09533 0 9.28493 0C9.47453 0 9.65649 0.0793351 9.79097 0.220677C9.85721 0.290046 9.90976 0.372607 9.94565 0.463596C9.98153 0.554585 10 0.652194 10 0.750779C10 0.849365 9.98153 0.946974 9.94565 1.03796C9.90976 1.12895 9.85721 1.21152 9.79097 1.28089L5.50595 5.77932C5.37147 5.92066 5.1896 6 5 6C4.8104 6 4.62853 5.92066 4.49405 5.77932L0.209032 1.28089C0.14279 1.21152 0.0902398 1.12895 0.0543536 1.03796C0.0184674 0.946974 0 0.849365 0 0.750779C0 0.652194 0.0184674 0.554585 0.0543536 0.463596C0.0902398 0.372607 0.14279 0.290046 0.209032 0.220677C0.343604 0.0795203 0.525523 0.000314919 0.715067 0.000314919C0.904612 0.000314919 1.08644 0.0795203 1.22101 0.220677L4.99929 4.18863Z" fill="#8A8A8A" />
                                </svg>
                            </div>
                            <input
                                type="number"
                                min={1}
                                className='common-input'
                                style={{
                                    flex: "0 0 25%",
                                    border: focusedInput === "toDo" ? "2px solid #F29DB6" : "2px solid #D9E1E7"
                                }}
                                value={missionToModify._id !== null ? missionToModify.toDo : newMission.toDo}
                                placeholder={"add or modify one of the specialities"}
                                onChange={(e) => {
                                    if (missionToModify?._id !== null) {
                                        setMissionToModify({ ...missionToModify, toDo: e.target.value });
                                    } else {
                                        setNewMission({ ...newMission, toDo: e.target.value });
                                    }
                                }}
                                onFocus={() => setFocusedInput("toDo")}
                                onBlur={() => setFocusedInput(null)}
                                required
                            />
                            <button
                                className='annuler-button'
                                style={{
                                    flex: 1,
                                    minWidth: "110px"
                                }}
                                onClick={(e) => { annulerModifier(e); setNewMission({ type: "", toDo: 0 }) }}
                            >
                                Cancel
                            </button>
                            {
                                !modifieClicked ?
                                    <button
                                        className='ajouter-btn'
                                        style={{
                                            flex: 1,
                                            minWidth: "110px"
                                        }}
                                        onClick={(e) => handleSubmit(e)}
                                    >
                                        Add
                                    </button>
                                    :
                                    <button
                                        className='ajouter-btn'
                                        style={{
                                            flex: 1,
                                            minWidth: "110px"
                                        }}
                                        onClick={(e) => { e.preventDefault(); setConfirmModifie(true) }}
                                    >
                                        Update
                                    </button>
                            }

                        </form>
                        <div className="specs-table">
                            {
                                missions.map((mission, index) => (
                                    <div
                                        className={`speciality-line ${selectedMission === index ? "selected" : ""}`}
                                        onClick={() => setSelectedMission(index)}
                                    >
                                        <div className="span-wrapper" style={{ flex: "0 0 40%", display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "0.9rem" }}>
                                                Mission {index + 1}: {missionTypes.find((m) => m.value === mission.type).msg}
                                            </span>
                                            <span style={{ fontSize: "0.9rem", textAlign: "left" }}>
                                                Required: {mission.toDo}
                                            </span>
                                        </div>
                                        <div className="line-btns">
                                            <button
                                                onClick={() => {
                                                    setNewMission({ type: "", toDo: 0 })
                                                    setMissionToModify({ ...missionToModify, _id: mission._id, type: mission.type, toDo: mission.toDo });
                                                    setModifieClicked(true)
                                                }
                                                }
                                            >
                                                <EditIcon />
                                                Update
                                            </button>
                                            {/* <button
                                                onClick={() => {
                                                    setIdMissionToDelete(mission._id)
                                                    setConfirmDelete(true)
                                                }}
                                            >
                                                <DeleteIcon />
                                                Delete
                                            </button> */}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                confirmModifie && <ModifierAlert handlemodifie={handlemodifie} annulerModifier={annulerModifier} phrase={"Are you certain you wanna update this mission?"} />
            }
            {
                idMissionToDelete && <DeleteConfirmPopup onClose={() => setIdMissionToDelete(null)} title={"Delete Mission"} onDelete={handleDelete} />
            }
        </div>
    )
}

const ModifierAlert = ({ annulerModifier, handlemodifie, phrase }) => {
    return (
        <div className="modifier-alert-overlay">
            <div className="modifier-alert">
                <div className="modifier-alert-icon">
                    <EditIcon />
                </div>
                <div className="modifier-alert-text">
                    <p className="modifier-alert-title">Update Mission</p>
                    <p className="modifier-alert-phrase">{phrase}</p>
                </div>
                <div className="modifier-alert-btns">
                    <button className="modifier-btn-cancel" onClick={(e) => annulerModifier(e)}>
                        Cancel
                    </button>
                    <button className="modifier-btn-confirm" onClick={(e) => handlemodifie(e)}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    )
}

const AddAlert = ({ addSuccess, phrase }) => {
    return (
        <div className="add-departement-success">
            <div className="img-container" style={{ height: "90px", width: "100px" }}>
                <img src={doneImg} alt="done" style={{ height: "100%", width: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </div>
            <span style={{ width: "95%", fontFamily: "Kumbh Sans, sans-serif", textAlign: "center", fontSize: "1.1rem", fontWeight: "500" }}>
                {`✨${phrase}✨`}
            </span>
            <button
                style={{
                    alignSelf: "flex-end",
                    marginTop: "auto",
                    padding: "5px 0",
                    background: "#A67EF2",
                    width: "80px",
                    borderRadius: "20px",
                    color: "#fff",
                    fontWeight: "500"
                }}
                onClick={(e) => { e.preventDefault(); addSuccess() }}
            >
                OK
            </button>
        </div>
    )
}


export default Missions
