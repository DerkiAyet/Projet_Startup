import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import "../Styles/MyStudents.css";
import ListStudents from "../Components/ListStudents";

axios.defaults.withCredentials = true;

const STUDENT_COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getStudentColor = (studentId) => {
    const index = Number(studentId) % STUDENT_COLORS.length;
    return STUDENT_COLORS[index];
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="ms-tooltip">
                <p className="ms-tooltip-label">{label}</p>
                <p className="ms-tooltip-value">{payload[0].value}{payload[0].name === "avg" ? "%" : " enrollments"}</p>
            </div>
        );
    }
    return null;
};

function ActivityDonut({ data }) {
    if (!data) return null;

    const total = data.solutions + data.quizAttempts + data.enrollments;
    const items = [
        { label: 'Assignment solutions', value: data.solutions, color: '#BA68C8' },
        { label: 'Quiz attempts', value: data.quizAttempts, color: '#FFC727' },
        { label: 'Course enrollments', value: data.enrollments, color: '#FFB6C1' },
    ];

    return (
        <div className="ms-card">
            <p className="ms-card-title">Student activity breakdown</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>

                {/* Fixed size so the absolute center label knows where to sit */}
                <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
                    <PieChart width={180} height={180}>
                        <Pie
                            data={items}
                            dataKey="value"
                            cx={85}
                            cy={85}
                            innerRadius={55}
                            outerRadius={80}
                            strokeWidth={3}
                        >
                            {items.map((entry) => (
                                <Cell key={entry.label} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [
                                `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                            ]}
                        />
                    </PieChart>
                    {/* Center label — works because parent has fixed 180x180 */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--ms-text)' }}>{total}</span>
                        <span style={{ fontSize: 11, color: 'var(--ms-text-muted)' }}>total actions</span>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {items.map(item => (
                        <div key={item.label}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: 'var(--ms-text-muted)' }}>{item.label}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingLeft: 18 }}>
                                <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--ms-text)' }}>{item.value}</span>
                                <span style={{ fontSize: 12, color: 'var(--ms-text-muted)' }}>
                                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function MyStudents() {
    const [stats, setStats] = useState({});
    const [barData, setBarData] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [students, setStudents] = useState([]);
    const [activityBreakdown, setActivityBreakdown] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");


    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/my-students/stats`)
            .then(res => {
                setStats(res.data)
                setBarData(
                    res.data.enrollementPerCategories.map((e) => ({
                        name: e.subCategoryName,
                        enrollments: e.enrollments
                    }))
                )
            })
            .catch(console.error);

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/assignments/avg-score-by-subcategory`)
            .then(res => {
                setLineData(
                    res.data.avgScoreBySubcategory.map((a) => ({
                        name: a.subCategoryName,
                        avg: a.avgScorePercentage
                    }))
                )
            })

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/assignments/stats-by-student`)
            .then((res) => {
                setStudents(
                    res.data.statsByStudent.map((s) => ({
                        id: s.studentId,
                        initials: `${s.studentGivenName[0]}${s.studentFamilyName[0]}`.toUpperCase(),
                        name: `${s.studentGivenName} ${s.studentFamilyName}`,
                        solved: s.submissionCount,
                        avg: s.avgScorePercentage,
                        color: getStudentColor(s.studentId),
                    }))
                )
            })

        axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/assignments/activity-breakdown`)
            .then(res => setActivityBreakdown(res.data.breakdown))
            .catch(console.error);
    }, [])

    return (
        <div className="ms-container">
 
            {/* ── Header ── */}
            <div className="ms-header">
                <div className="ms-header-left">
                    <h1 className="ms-title">My Students</h1>
                    <p className="ms-subtitle">Track progress, review assignments, and monitor activity</p>
                </div>
                <div className="ms-tabs">
                    <button className={`ms-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
                    <button className={`ms-tab ${activeTab === "students" ? "active" : ""}`} onClick={() => setActiveTab("students")}>Students</button>
                </div>
            </div>

            {activeTab === "overview" ? <>
                <div className="ms-stats-row">
                    <StatCard value={stats?.totalEnrollments} label="Total Enrollements" sub="Across all courses" accent="#EC4899" />
                    <StatCard value={stats?.totalAssignments} label="Assignments posted" sub={`${stats?.solutions?.pendingSolutionsCount} pending review`} accent="#BA68C8" />
                    <StatCard value={stats?.solutions?.totalSolutions} label="Solutions submitted" sub="This month" accent="#16A085" />
                    <StatCard value={`${stats?.scores?.averagePercentage}%`} label="Average score" sub="All assignments" accent="#FFC727" />
                </div>

                <div className="ms-charts-row">
                    <div className="ms-card">
                        <p className="ms-card-title">Enrollements per Speciality</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--ms-border)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ms-text-muted)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--ms-text-muted)" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="enrollments" fill="#FFB6C1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="ms-card">
                        <p className="ms-card-title">Avg score per assignment</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={lineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--ms-border)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ms-text-muted)" }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "var(--ms-text-muted)" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="avg" stroke="#BA68C8" strokeWidth={2} dot={{ r: 4, fill: "#BA68C8" }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ms-bottom-row">

                    <ActivityDonut data={activityBreakdown} />

                    {/* Students ranking */}
                    <div className="ms-card ms-card-students">
                        <p className="ms-card-title">Top active students</p>
                        <div className="ms-students-list">
                            {students?.slice(0, 5).map((s, i) => (
                                <div className="ms-student-row" key={s.id}>
                                    <span className="ms-rank">#{i + 1}</span>
                                    <div className="ms-avatar" style={{ background: `${s.color}18`, color: s.color }}>
                                        {s.initials}
                                    </div>
                                    <div className="ms-student-info">
                                        <span className="ms-student-name">{s.name}</span>
                                        <span className="ms-student-detail">{s.solved} assignments solved</span>
                                    </div>
                                    <div className="ms-score-col">
                                        <div className="ms-mini-bar-bg">
                                            <div className="ms-mini-bar-fill" style={{ width: `${s.avg}%`, background: s.color }} />
                                        </div>
                                        <span className="ms-mini-pct" style={{ color: s.color }}>{s.avg}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </> :
                <ListStudents />
            }
        </div>
    );
}

function StatCard({ value, label, sub, accent }) {
    return (
        <div className="ms-stat-card">
            <div className="ms-stat-accent" style={{ background: `${accent}18` }}>
                <div className="ms-stat-dot" style={{ background: accent }} />
            </div>
            <div className="ms-stat-body">
                <span className="ms-stat-value">{value}</span>
                <span className="ms-stat-label">{label}</span>
                <span className="ms-stat-sub">{sub}</span>
            </div>
        </div>
    );
}