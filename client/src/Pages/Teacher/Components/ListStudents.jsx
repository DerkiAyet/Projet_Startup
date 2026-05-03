import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/ListStudents.css";
import { Link } from "react-router-dom";

const STUDENT_COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getStudentColor = (studentId) => {
    const index = Number(studentId) % STUDENT_COLORS.length;
    return STUDENT_COLORS[index];
};

const mockStudents = [
    { id: "1", givenName: "Ayet", familyName: "Kaci", email: "ayet.kaci@example.com", submissionCount: 6, avgScorePercentage: 88, enrollments: 3 },
    { id: "2", givenName: "Mohamed", familyName: "Rahmani", email: "m.rahmani@example.com", submissionCount: 5, avgScorePercentage: 74, enrollments: 2 },
    { id: "3", givenName: "Sara", familyName: "Benali", email: "sara.b@example.com", submissionCount: 5, avgScorePercentage: 70, enrollments: 4 },
    { id: "4", givenName: "Yacine", familyName: "Daoudi", email: "y.daoudi@example.com", submissionCount: 3, avgScorePercentage: 55, enrollments: 2 },
    { id: "5", givenName: "Nadia", familyName: "Bouali", email: "nadia.bo@example.com", submissionCount: 3, avgScorePercentage: 48, enrollments: 1 },
    { id: "6", givenName: "Karim", familyName: "Messaoudi", email: "k.messaoudi@example.com", submissionCount: 7, avgScorePercentage: 91, enrollments: 5 },
    { id: "7", givenName: "Lina", familyName: "Amrani", email: "lina.amrani@example.com", submissionCount: 4, avgScorePercentage: 62, enrollments: 3 },
];

function ScorePill({ score }) {
    let cls = "ls-score-pill";
    if (score >= 80) cls += " pill-high";
    else if (score >= 60) cls += " pill-mid";
    else cls += " pill-low";
    return <span className={cls}>{score}%</span>;
}

function Avatar({ initials, color }) {
    return (
        <div
            className="ls-avatar"
            style={{ background: `${color}18`, color }}
        >
            {initials}
        </div>
    );
}

export default function ListStudents() {
    const [students, setStudents] = useState(mockStudents);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios
            .get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/assignments/stats-by-student`)
            .then((res) => {
                setStudents(
                    res.data.statsByStudent.map((s) => ({
                        id: s.studentId,
                        givenName: s.studentGivenName,
                        familyName: s.studentFamilyName,
                        email: s.studentEmail ?? "",
                        submissionCount: s.submissionCount,
                        avgScorePercentage: s.avgScorePercentage,
                        enrollments: s.enrollmentCount ?? 0,
                    }))
                );
            })
            .catch(() => {/* keep mock data */ })
            .finally(() => setLoading(false));
    }, []);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };

    const openPanel = (student) => {
        setSelectedStudent(student);
        setPanelOpen(true);
    };

    const closePanel = () => {
        setPanelOpen(false);
        setTimeout(() => setSelectedStudent(null), 300);
    };

    const filtered = students
        .filter((s) => {
            const q = search.toLowerCase();
            return (
                s.givenName.toLowerCase().includes(q) ||
                s.familyName.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            let va, vb;
            if (sortKey === "name") { va = a.familyName; vb = b.familyName; }
            else if (sortKey === "submissions") { va = a.submissionCount; vb = b.submissionCount; }
            else if (sortKey === "avg") { va = a.avgScorePercentage; vb = b.avgScorePercentage; }
            else if (sortKey === "enrollments") { va = a.enrollments; vb = b.enrollments; }
            if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === "asc" ? va - vb : vb - va;
        });

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="ls-sort-icon ls-sort-idle">↕</span>;
        return <span className="ls-sort-icon ls-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const [solutions, setSolutions] = useState([]);

    useEffect(() => {
        if (!selectedStudent) return;

        setLoading(true);

        axios
            .get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/student/${selectedStudent.id}/solutions`)
            .then(res => setSolutions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [selectedStudent]);

    const getStatus = (solution) => {
        if (solution.status === 'graded') {
            return { label: "Graded", color: '#10B981', bg: '#10B98115' }
        } else {
            return { label: "On hold", color: '#F59E0B', bg: '#F59E0B15' }
        }
    }

    return (
        <div className="ls-wrapper">
            {/* ── Toolbar ── */}
            <div className="ls-toolbar">
                <div className="ls-search-box">
                    <svg className="ls-search-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        className="ls-search"
                        placeholder="Search students…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span className="ls-count">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* ── Table ── */}
            <div className="ls-table-wrap">
                <table className="ls-table">
                    <thead>
                        <tr>
                            <th className="ls-th" style={{ width: 40 }}>#</th>
                            <th className="ls-th ls-th-sortable" onClick={() => handleSort("name")}>
                                Student <SortIcon col="name" />
                            </th>
                            <th className="ls-th">Email</th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("enrollments")}>
                                Courses <SortIcon col="enrollments" />
                            </th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("submissions")}>
                                Submissions <SortIcon col="submissions" />
                            </th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("avg")}>
                                Avg score <SortIcon col="avg" />
                            </th>
                            <th className="ls-th" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="ls-empty">
                                    <span className="ls-spinner" />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="ls-empty">No students found</td>
                            </tr>
                        ) : (
                            filtered.map((s, i) => {
                                const color = getStudentColor(s.id);
                                const initials = `${s.givenName[0]}${s.familyName[0]}`.toUpperCase();
                                const isSelected = selectedStudent?.id === s.id && panelOpen;
                                return (
                                    <tr
                                        key={s.id}
                                        className={`ls-row ${isSelected ? "ls-row-active" : ""}`}
                                    >
                                        <td className="ls-td ls-td-rank">{i + 1}</td>
                                        <td className="ls-td">
                                            <div className="ls-name-cell">
                                                <Avatar initials={initials} color={color} />
                                                <span className="ls-name">{s.givenName} {s.familyName}</span>
                                            </div>
                                        </td>
                                        <td className="ls-td ls-td-muted">{s.email || "—"}</td>
                                        <td className="ls-td ls-td-center">
                                            <span className="ls-chip">{s.enrollments}</span>
                                        </td>
                                        <td className="ls-td ls-td-center">
                                            <span className="ls-chip">{s.submissionCount}</span>
                                        </td>
                                        <td className="ls-td ls-td-center">
                                            <div className="ls-score-cell">
                                                <div className="ls-bar-bg">
                                                    <div
                                                        className="ls-bar-fill"
                                                        style={{ width: `${s.avgScorePercentage}%`, background: color }}
                                                    />
                                                </div>
                                                <ScorePill score={s.avgScorePercentage} />
                                            </div>
                                        </td>
                                        <td className="ls-td ls-td-action">
                                            <button
                                                className="ls-view-btn"
                                                onClick={() => openPanel(s)}
                                            >
                                                View
                                                <svg viewBox="0 0 16 16" fill="none" className="ls-view-arrow">
                                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Side panel overlay ── */}
            {panelOpen && (
                <div className="ls-overlay" onClick={closePanel} />
            )}

            {/* ── Side panel ── */}
            <div className={`ls-panel ${panelOpen ? "ls-panel-open" : ""}`}>
                {selectedStudent && (() => {
                    const s = selectedStudent;
                    const color = getStudentColor(s.id);
                    const initials = `${s.givenName[0]}${s.familyName[0]}`.toUpperCase();
                    return (
                        <>
                            <div className="ls-panel-header">
                                <button className="ls-panel-close" onClick={closePanel} aria-label="Close">
                                    <svg viewBox="0 0 16 16" fill="none">
                                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <div className="ls-panel-hero">
                                    <div className="ls-panel-avatar" style={{ background: `${color}18`, color }}>
                                        {initials}
                                    </div>
                                    <div>
                                        <h2 className="ls-panel-name">{s.givenName} {s.familyName}</h2>
                                        <p className="ls-panel-email">{s.email || "No email"}</p>
                                    </div>
                                </div>

                                <div className="ls-panel-stats">
                                    <div className="ls-panel-stat">
                                        <span className="ls-panel-stat-val" style={{ color }}>{s.avgScorePercentage}%</span>
                                        <span className="ls-panel-stat-label">Avg score</span>
                                    </div>
                                    <div className="ls-panel-stat-divider" />
                                    <div className="ls-panel-stat">
                                        <span className="ls-panel-stat-val">{s.submissionCount}</span>
                                        <span className="ls-panel-stat-label">Submissions</span>
                                    </div>
                                    <div className="ls-panel-stat-divider" />
                                    <div className="ls-panel-stat">
                                        <span className="ls-panel-stat-val">{s.enrollments}</span>
                                        <span className="ls-panel-stat-label">Courses</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ls-panel-body">
                                {/* Placeholder — add your detail sections here */}
                                <p className="ls-panel-section-title">Details</p>
                                <div className="ls-panel-section-title">Student Solutions</div>

                                <div className="ls-solutions-list">
                                    {solutions.length === 0 && (
                                        <p className="ls-no-solutions">No solutions submitted yet.</p>
                                    )}

                                    {solutions.map((sol) => (
                                        <div className="ls-solution-item" key={sol.solution._id}>
                                            <div className="ls-solution-info">
                                                <h4 className="ls-solution-title">{sol.title}</h4>
                                                <p className="ls-solution-speciality">{sol.speciality}</p>

                                                <div className="ls-score-row">
                                                    <span className="ls-score-label">Score:</span>
                                                    <span className="ls-score-val">
                                                        {sol.solution.score} / {sol.maxScore}
                                                    </span>
                                                </div>

                                                 <div className="ls-score-row">
                                                    <span className="ls-score-label">Status:</span>
                                                    <span className="ls-score-val ls-status-val" style={{backgroundColor: getStatus(sol.solution).bg, color: getStatus(sol.solution).color } }>
                                                        {getStatus(sol.solution).label}
                                                    </span>
                                                </div>
                                            </div>

                                            <Link
                                                to={`/activities/review-assignment/${sol.solution._id}`}
                                                className="ls-solution-view-btn"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}