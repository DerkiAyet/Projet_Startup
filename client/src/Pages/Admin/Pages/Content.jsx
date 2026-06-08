import React, { useEffect, useState } from 'react'
import "../Styles/Users.css"
import ListUsers from '../Components/ListUsers';
import axios from 'axios'
import ListContent from "../Components/ListContent";

function Content() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/courses`)
      .then(res => setCourses(res.data))
      .catch(err => console.error(err));

    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/assignments`)
      .then(res => setAssignments(res.data))
      .catch(err => console.error(err));
  }, []);

  const data = activeTab === "courses" ? courses : assignments;

  return (
    <div className="users-admin-container">
      <div className="users-admin-wrapper">
        <div className="users-header">
          <div className="users-header-left">
            <h1 className="users-title">Content</h1>
            <p className="users-subtitle">Manage all courses and assignments.</p>
          </div>
          <div className="users-tabs">
            <button className={`users-tab ${activeTab === "courses" ? "active" : ""}`} onClick={() => setActiveTab("courses")}>Courses</button>
            <button className={`users-tab ${activeTab === "assignments" ? "active" : ""}`} onClick={() => setActiveTab("assignments")}>Assignments</button>
          </div>
        </div>
        <div className="users-admin-body">
          <ListContent data={data} />
        </div>
      </div>
    </div>
  );
}

export default Content;