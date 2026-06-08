import React, { useEffect, useState } from 'react'
import "../Styles/Users.css"
import ListUsers from '../Components/ListUsers';
import axios from 'axios'

function Users() {
    const [activeTab, setActiveTab] = useState("teachers");
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [parents, setParents] = useState([])
    const [users, setUsers] = useState([])

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/admin/get-teachers`)
            .then((res) => {setTeachers(res.data)})
            .catch((err) => console.error(err.response.data))
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/admin/get-students`)
            .then((res) => setStudents(res.data))
            .catch((err) => console.error(err.response.data))
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/admin/get-parents`)
            .then((res) => setParents(res.data))
            .catch((err) => console.error(err.response.data))
    }, [])

    useEffect(() => {
        switch (activeTab) {
            case "teachers":
                setUsers(teachers); break;
            case "students":
                setUsers(students); break;
            case "parents":
                setUsers(parents); break;
            default:
                setUsers([]);
        }
    }, [activeTab, teachers, students, parents]) // ✅ reacts to data arriving too

    return (
        <div className='users-admin-container'>
            <div className="users-admin-wrapper">
                <div className="users-header">
                    <div className="users-header-left">
                        <h1 className="users-title">Users</h1>
                        <p className="users-subtitle">View and manage all users and their information from a single place.</p>
                    </div>
                    <div className="users-tabs">
                        <button className={`users-tab ${activeTab === "teachers" ? "active" : ""}`} onClick={() => setActiveTab("teachers")}>Teachers</button>
                        <button className={`users-tab ${activeTab === "students" ? "active" : ""}`} onClick={() => setActiveTab("students")}>Students</button>
                        <button className={`users-tab ${activeTab === "parents" ? "active" : ""}`} onClick={() => setActiveTab("parents")}>Parents</button>
                    </div>
                </div>
                <div className="users-admin-body">
                  <ListUsers data={users} />
                </div>
            </div>
        </div>
    )
}

export default Users