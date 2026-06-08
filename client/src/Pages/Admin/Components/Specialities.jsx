import React, { useEffect, useState } from 'react'
import '../Styles/Specialities.css'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ReactComponent as SearchIcon } from '../../../Assets/icons/CourseIcons/search-course.svg'
import { ReactComponent as DeleteIcon } from '../../../Assets/icons/TimelineIcons/mi_delete.svg'
import { ReactComponent as EditIcon } from '../../../Assets/icons/CourseIcons/edit-course.svg'
import doneImg from "../../../Assets/images/done.png"
import { DeleteConfirmPopup } from '../../../Shared/Components/DeletePopup'

function Specialities() {
    const { subjectId } = useParams();

    const [subSubjects, setSubSubjects] = useState([]);
    const [subject, setSubject] = useState({})

    useEffect(() => {

        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/infos/subjects/${subjectId}`)
            .then((res) => setSubject(res.data))
            .catch((err) => console.error(err.response.data))

        axios.defaults.withCredentials = true
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/auth/infos/subjects/${subjectId}/specialities`)
            .then((res) => setSubSubjects(res.data))
            .catch((err) => console.error(err.response.data))

    }, [subjectId])

    const [searchQuery, setSearchQuery] = useState('')

    const [newSpeciality, setNewSpeciality] = useState({
        name: ""
    });
    const [selectedSpeciality, setSelectedSpeciality] = useState(0)

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            const res = await axios.post(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/subjects/${subjectId}/add-sub-subject`, newSpeciality, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            setSubSubjects((prev) => [...prev, res.data.newSub])
            setNewSpeciality({ name: "" })
        } catch (error) {
            console.error(error.message)
        }

    }

    const [specialityToModify, setSpecialityToModify] = useState({
        idSub: null,
        name: ""
    });

    const handlemodifie = async (e) => {
        e.preventDefault()
        try {
            if (specialityToModify.idSub) {
                const res = await axios.put(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/subjects/${subjectId}/sub-subjects/${specialityToModify.idSub}`, { name: specialityToModify.name }, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                })

                setSubSubjects((prev) =>
                    prev.map((s) =>
                        s.idSub === specialityToModify.idSub ? { ...s, name: res.data.subSubject.name }
                            : s
                    )
                )
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
        setSpecialityToModify({
            idSub: null,
            name: "",
        });
        setNewSpeciality({ name: "" })
        setConfirmModifie(false)
    }

    const [idSpecToDelete, setIdSpecToDelete] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = async () => {
        try {
            if (idSpecToDelete) {
                await axios.delete(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/subjects/${subjectId}/sub-subjects/${idSpecToDelete}`)
                setSubSubjects((prev) =>
                    prev.filter((s, idx) => s.idSub !== idSpecToDelete)
                )
            }
            annulerDelete();
        } catch (error) {
            console.error(error.message)
        }

    }

    const annulerDelete = () => {
        setIdSpecToDelete(null)
        setNewSpeciality({ name: "" })
        setConfirmDelete(false)
    }

    const filteredSpecs = subSubjects.filter((spec) => spec.name.toLowerCase().includes(searchQuery.toLocaleLowerCase()))

    return (
        <div className='specs-container'>
            <div className="specs-wrapper">
                <div className="specs-page-header">
                    <div className="title-wrapper">
                        <h1>System Settings &gt;<span><Link className='link' to='/settings/subjects'>Subjects</Link></span>&gt; {subject.name} &gt; <span>Specialities</span></h1>
                        <p>Manage and organize all course specialities across the platform.</p>
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
                    </div>
                </div>

                <div
                    className="formSpec-container"
                >
                    <h1 style={{ fontSize: "1.85rem", color: "#000", fontWeight: "500" }}>
                        Subfields
                    </h1>
                    <p style={{ color: "#5F5F5F", fontSize: "1.1rem", fontFamily: "Nunito, sans serif", width: "630px" }}>
                        Manage the subfields connected to this subject.
                    </p>
                    <div
                        className="form-table-container"
                    >
                        <form action="">
                            <input
                                type="text"
                                className='common-input'
                                style={{
                                    flex: "0 0 64%"
                                }}
                                value={specialityToModify.idSub !== null ? specialityToModify.name : newSpeciality.name}
                                placeholder={"add or modify one of the specialities"}
                                onChange={(e) => {
                                    if (specialityToModify?.idSub !== null) {
                                        setSpecialityToModify({ ...specialityToModify, name: e.target.value });
                                    } else {
                                        setNewSpeciality({ ...newSpeciality, name: e.target.value });
                                    }
                                }}
                                required
                            />
                            <button
                                className='annuler-button'
                                style={{
                                    flex: 1,
                                    minWidth: "110px"
                                }}
                                onClick={(e) => { annulerModifier(e); setNewSpeciality({ name: "" }) }}
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
                                filteredSpecs.map((spec, index) => (
                                    <div
                                        className={`speciality-line ${selectedSpeciality === index ? "selected" : ""}`}
                                        onClick={() => setSelectedSpeciality(index)}
                                    >
                                        <span style={{ fontSize: "0.9rem" }}>
                                            Subfield: {spec.name}
                                        </span>
                                        <div className="line-btns">
                                            <button
                                                onClick={() => {
                                                    setNewSpeciality({ name: "" })
                                                    setSpecialityToModify({ ...specialityToModify, idSub: spec.idSub, name: spec.name });                                                }
                                                }
                                            >
                                                <EditIcon />
                                                Update
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIdSpecToDelete(spec.idSub)
                                                    setConfirmDelete(true)
                                                }}
                                            >
                                                <DeleteIcon />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                modifieClicked && <ModifierAlert handlemodifie={handlemodifie} annulerModifier={annulerModifier} phrase={"Are you certain you wanna update this subfield?"} />
            }
            {
                idSpecToDelete && <DeleteConfirmPopup onClose={() => setIdSpecToDelete(null)} title={"Delete Subfield"} onDelete={handleDelete} />
            }
        </div>
    )
}

const ModifierAlert = ({ annulerModifier, handlemodifie, phrase }) => {
    return (
        <div className="add-departement-success">
            <div className="img-container" style={{ height: "90px", width: "150px" }}>
                <img src={doneImg} alt="done" style={{ height: "100%", width: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </div>
            <span style={{ width: "95%", fontFamily: "Kumbh Sans, sans-serif", textAlign: "center", fontSize: "1.1rem", fontWeight: "500" }}>
                {`${phrase}`}
            </span>
            <div
                className="btns-line"
            >
                <button
                    style={{
                        color: "#000",
                        background: "#E2E4E5"
                    }}
                    onClick={(e) => { annulerModifier(e) }}
                >
                    Annuler
                </button>
                <button
                    style={{

                    }}
                    onClick={(e) => { handlemodifie(e); }}
                >
                    Modifier
                </button>
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


export default Specialities
