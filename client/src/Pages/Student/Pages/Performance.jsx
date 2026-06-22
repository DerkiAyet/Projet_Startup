import React, { useState, useEffect, useContext } from "react";
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import "../../Teacher/Styles/MyStudents.css";
import "../Styles/Performance.css"
import { AppContext } from "../../../App";

axios.defaults.withCredentials = true;

// const STUDENT_COLORS = [
//     "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
//     "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
// ];

const getMessage = (type, toDo) => {
    switch (type) {
        case "PUBLISH_POST":
            return `Publish ${toDo} post(s)`;

        case "NEW_FOLLOWEE":
            return `Follow ${toDo} user(s)`;

        case "NEW_FOLLOWER":
            return `Gain ${toDo} new follower(s)`;

        case "ENROLL_COURSE":
            return `Enroll in ${toDo} course(s)`;

        case "SOLVE_QUIZ":
            return `Complete ${toDo} quiz(zes)`;

        case "SEND_SOLUTION":
            return `Submit ${toDo} solution(s)`;

        case "GET_GRADE":
            return `Earn ${toDo} graded result(s)`;

        case "PARTICIPATE_CLASSROOM":
            return `Join ${toDo} classroom session(s)`;

        case "DO_HOMEWORK":
            return `Complete ${toDo} homework task(s)`;

        case "PARTICPATE_SESSION":
            return `Participate in ${toDo} live session(s)`;

        case "SHARE_RESSOURCE":
            return `Share ${toDo} learning resource(s)`;

        default:
            return "Unknown mission";
    }
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

export default function MyPerformance() {

    const { userAuth } = useContext(AppContext)

    const [barData, setBarData] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [activityBreakdown, setActivityBreakdown] = useState(null);
    const [loading, setLoading] = useState(false)
    const [gameProgress, setGameProgress] = useState(null);

    useEffect(() => {

        const fetchData = async () => {
            setLoading(true)
            try {
                const [progressRes, perCategoryRes, gameRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/progress/me`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/progress/me/assignments/avg-score-by-subcategory`),
                    axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/game/achievements/my-progress`)
                ])

                setBarData(
                    progressRes.data.enrollmentsBySubCategory.map((e) => ({
                        name: e.subCategoryName,
                        enrollments: e.count
                    }))
                )

                setActivityBreakdown({
                    solutions: progressRes.data.totalSubmissions,
                    quizAttempts: progressRes.data.totalQuizAttempts,
                    enrollments: progressRes.data.totalEnrollments
                })

                setLineData(
                    perCategoryRes.data.map((a) => ({
                        name: a.subCategoryName,
                        avg: a.avgScorePercentage
                    }))
                )

                setGameProgress(gameRes.data)
            } catch (error) {
                console.error("error while fetching", error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

    }, [])

    if (loading) {
        return (
            <div className="search-loading">
                <div className="loading-spinner" />
                <span>Fetching your performance...</span>
            </div>

        )
    }

    const achievementsOfCurrentLevel = gameProgress
        ? gameProgress.currentProgress?.achievements?.filter((achievement) =>
            gameProgress.currentLevel?.missions?.some(
                (mission) => achievement.missionId === mission._id
            )
        )
        : [];

    return (
        <div className="ms-container">

            <div className="ms-header">
                <div className="ms-header-left">
                    <h1 className="ms-title">My Progress</h1>
                    <p className="ms-subtitle">Track progress, review assignments, and monitor activity</p>
                </div>
            </div>

            {gameProgress && (
                <>
                    <div className="ms-xp-bar-card">
                        <div className="ms-xp-avatar">
                            {userAuth?.userImg
                                ? <img src={`${process.env.REACT_APP_API_URL_GATEWAY}/auth/uploads/${userAuth.userImg}`} alt="avatar" />
                                : <span>{userAuth?.givenName?.[0]}{userAuth?.familyName?.[0]}</span>
                            }
                        </div>
                        <div className="ms-xp-info">
                            <div className="ms-xp-top-row">
                                <div>
                                    <span className="ms-xp-level-name">{gameProgress.currentLevel?.name}</span>
                                    <span className="ms-xp-label">
                                        {gameProgress.nextLevel
                                            ? `Level ${gameProgress.currentProgress?.xp} / ${gameProgress.nextLevel.xpRequired} XP`
                                            : `Max Level Reached 🏆`
                                        }
                                    </span>
                                </div>
                                <div className="ms-xp-points-badge">
                                    <span className="ms-xp-points-value">{gameProgress.currentProgress?.points}</span>
                                    <span className="ms-xp-points-label">pts</span>
                                </div>
                            </div>
                            <div className="ms-xp-track">
                                <div
                                    className="ms-xp-fill"
                                    style={{
                                        width: `${gameProgress.nextLevel
                                            ? Math.min((gameProgress.currentProgress?.xp / gameProgress.nextLevel.xpRequired) * 100, 100)
                                            : 100}%`
                                    }}
                                />
                            </div>
                            <div className="ms-xp-bottom-row">
                                <span className="ms-xp-hint">{gameProgress.currentProgress?.xp} XP earned</span>
                                {gameProgress.nextLevel
                                    ? <span className="ms-xp-hint">{gameProgress.nextLevel.xpRequired - gameProgress.currentProgress?.xp} XP to next level</span>
                                    : <span className="ms-xp-hint">🎉 You've reached the highest level!</span>
                                }
                            </div>
                        </div>
                        <img
                            src={`${process.env.REACT_APP_API_URL_GATEWAY}/game/uploads/${gameProgress.currentLevel?.coverImg}`}
                            alt="current badge"
                            className="ms-xp-badge-img"
                        />
                    </div>

                    <div className="ms-bottom-row">
                        <div className="ms-card ms-achievements-card">
                            <p className="ms-card-title">What you've achieved in this level</p>
                            <div className="ms-achievements-list">
                                {achievementsOfCurrentLevel
                                    .filter(a => a.completed)
                                    .map(a => (
                                        <div key={a._id} className="ms-achievement-row">
                                            <div className="ms-achievement-icon">✓</div>
                                            <div className="ms-achievement-info">
                                                <span className="ms-achievement-label">
                                                    {getMessage(
                                                        gameProgress.currentLevel?.missions?.find(
                                                            m => m._id === a.missionId
                                                        )?.type ?? '',
                                                        gameProgress.currentLevel?.missions?.find(
                                                            m => m._id === a.missionId
                                                        )?.toDo ?? ''
                                                    )}
                                                </span>
                                                <span className="ms-achievement-date">
                                                    {new Date(a.achievedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="ms-card ms-missions-card">
                            <div className="ms-missions-header">
                                <p className="ms-card-title" style={{ margin: 0 }}>Missions to complete</p>
                                {gameProgress.nextLevel && (
                                    <div className="ms-next-level">
                                        <img
                                            src={`${process.env.REACT_APP_API_URL_GATEWAY}/game/uploads/${gameProgress.nextLevel?.coverImg}`}
                                            alt="next level"
                                            className="ms-next-level-img"
                                        />
                                        <span className="ms-next-level-label">{gameProgress.nextLevel?.name}</span>
                                    </div>
                                )}
                            </div>
                            <div className="ms-missions-list">
                                {gameProgress.whatToDo.map(m => {
                                    const pct = m.toDo > 0 ? Math.round((m.progress / m.toDo) * 100) : 0;
                                    return (
                                        <div key={m._id} className="ms-mission-row">
                                            <div className="ms-mission-top">
                                                <span className="ms-mission-label">{getMessage(m.type, m.toDo)}</span>
                                                <span className="ms-mission-pct">{m.progress}/{m.toDo}</span>
                                            </div>
                                            <div className="ms-mission-track">
                                                <div className="ms-mission-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

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

            {/* <div className="ms-bottom-row">

                <ActivityDonut data={activityBreakdown} />
                <div className="ms-card ms-card-students">
                    <p className="ms-card-title">Top Students</p>
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

            </div> */}
        </div>
    );
}