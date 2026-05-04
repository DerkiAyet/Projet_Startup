import React, { useEffect, useState } from 'react'
import '../Styles/MyChildren.css'
import { ReactComponent as MenuIcon } from '../../../Assets/icons/CourseIcons/menu-dots.svg'
import { AddChild } from '../Components/AddChild';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import axios from 'axios'

const getInitials = (givenName = '', familyName = '') =>
    `${givenName.charAt(0)}${familyName.charAt(0)}`.toUpperCase();

const CHILDREN_COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getChildColor = (childId) => {
    const index = Number(childId) % CHILDREN_COLORS.length;
    return CHILDREN_COLORS[index];
};

const withAlpha = (hex, alpha = "22") => `${hex}${alpha}`;

const mock_children = [
    {
        id: 1,
        familyName: "Derki",
        givenName: "Ayet",
        level: 2,
        enrollCount: 3,
        submissions: 2
    },
    {
        id: 5,
        familyName: "Derki",
        givenName: "Mouad",
        level: 1,
        enrollCount: 1,
        submissions: 0
    },
    {
        id: 10,
        familyName: "Derki",
        givenName: "Islem",
        level: 4,
        enrollCount: 10,
        submissions: 12
    }
]

// const barData = [
//     {
//         name: "Algebra", enrollments: 10
//     },
//     {
//         name: "Geometry", enrollments: 3
//     },
//     {
//         name: "Physics", enrollments: 1
//     },
//     {
//         name: "Mobile Development", enrollments: 7
//     },
//     {
//         name: "CS", enrollments: 4
//     },
//     {
//         name: "French", enrollments: 1
//     },
//     {
//         name: "Arabic", enrollments: 12
//     }
// ]

// const lineData = [
//     {
//         name: "Arabic",
//         avg: 20
//     },
//     {
//         name: "Algebra",
//         avg: 52
//     },
//     {
//         name: "Geography",
//         avg: 73
//     }
// ]

// const donutData = {
//     solutions: 3,
//     quizAttempts: 4,
//     enrollments: 7
// }

const ChildCard = ({ color, child, active, handleClick }) => {
    const initials = getInitials(child.givenName, child.familyName);
    return (
        <div className={`child-card ${active ? "--active" : ""}`} onClick={handleClick}>
            <MenuIcon className="menu-card-icon" />

            <div className="cc-top">
                <div className="cc-avatar" style={{ background: withAlpha(color) }}>
                    <div className="avatar-initials" style={{ color: color }}>{initials}</div>
                </div>

                <div className="cc-main-info">
                    <h4 className="child-name">{`${child.givenName} ${child.familyName}`}</h4>
                    <span className='child-level' style={{ backgroundColor: color }}>Level {child.level}</span>
                </div>
            </div>

            <div className="cc-stats">
                <div className="cc-stat-box" style={{ background: withAlpha(color) }}>
                    <h6 style={{ color: color }}>{child.totalEnrollments}</h6>
                    <span style={{ color: color }}>Enrollments</span>
                </div>
                <div className="cc-stat-box cc-stat-neutral">
                    <h6>{child.totalSubmissions}</h6>
                    <span>Assignments</span>
                </div>
            </div>

            <div className="cc-footer">
                <span>Supervising since: {child.linkedAt}</span>
            </div>
        </div>
    )
}

const AddChildCard = ({ onAdd }) => (
    <div className="add-child-card" onClick={onAdd} role="button" tabIndex={0}>
        <svg className="add-squiggle" viewBox="0 0 44 18" fill="none" aria-hidden="true">
            <path
                d="M2 9 Q8 2 15 9 Q22 16 29 9 Q36 2 42 9"
                stroke="#EC4899"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
        <div className="add-circle">+</div>
        <h4 className="add-title">Add Child</h4>
        <p className="add-sub">Register a new student</p>
    </div>
);

function MyChildren() {

    const [children, setChildren] = useState([])
    const [addChildClicked, setAddChildClicked] = useState(false)
    const [selectedChild, setSelectedChild] = useState(null)

    const [donutData, setDonutData] = useState(null)
    const [barData, setBarData] = useState([])
    const [lineData, setLineData] = useState([])

    const [recommendations, setRecommendations] = useState([])
    const fetchRecommendations = async (childId) => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/recommendations/children/${childId}/my-recommendations`)
            setRecommendations(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/stats/my-children/stats`)
                setChildren(res.data.childrenStats?.map((c) => ({
                    studentId: c.studentId,
                    familyName: c.familyName,
                    givenName: c.givenName,
                    level: 0,
                    linkedAt: new Date(c.linkedAt).toLocaleDateString(),
                    totalEnrollments: c.totalEnrollments,
                    enrollmentsBySubCategory: c.enrollmentsBySubCategory,
                    totalSubmissions: c.totalSubmissions,
                    avgScoreByCategory: c.avgScoreByCategory,
                    overallAvgScorePercentage: c.overallAvgScorePercentage,
                    totalQuizAttempts: c.totalQuizAttempts
                })))
                setSelectedChild(res.data.childrenStats?.[0])
                fetchRecommendations(res.data.childrenStats?.[0]?.studentId)
                setDonutData({
                    solutions: res.data.childrenStats?.[0].totalSubmissions,
                    quizAttempts: res.data.childrenStats?.[0].totalQuizAttempts,
                    enrollments: res.data.childrenStats?.[0].totalEnrollments
                })
                setBarData(res.data.childrenStats?.[0].enrollmentsBySubCategory?.map((c) => ({
                    name: c.subCategoryName,
                    enrollments: c.count
                })))
                setLineData(res.data.childrenStats?.[0].avgScoreByCategory?.map((c) => ({
                    name: c.subCategoryName,
                    avg: c.avgScorePercentage
                })))
            } catch (error) {
                console.error(error)
            }
        }

        fetchData()

    }, [])

    const handleSelectChild = (child) => {
        setSelectedChild(child)
        setDonutData({
            solutions: child.totalSubmissions,
            quizAttempts: child.totalQuizAttempts,
            enrollments: child.totalEnrollments
        })
        setBarData(child.enrollmentsBySubCategory?.map((c) => ({
            name: c.subCategoryName,
            enrollments: c.count
        })))
        setLineData(child.avgScoreByCategory?.map((c) => ({
            name: c.subCategoryName,
            avg: c.avgScorePercentage
        })))
        fetchRecommendations(child.studentId)
    }

    return (
        <div className='mychildren-container'>
            <div className="mychildren-wrapper">
                <div className="mc-header">
                    <div className="mc-header-left">
                        <h1 className="mc-title">My Children</h1>
                    </div>
                    <div className="children-wrap">
                        {
                            children.map((child) => (
                                <ChildCard color={getChildColor(child.studentId)} child={child} active={child.studentId === selectedChild.studentId} handleClick={() => handleSelectChild(child)} />
                            ))
                        }
                        <AddChildCard onAdd={() => setAddChildClicked(true)} />
                    </div>
                </div>
                <div className="mc-body">
                    <div className="mc-charts-row">
                        <div className="mc-card">
                            <p className="mc-card-title">Enrollements per Speciality</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--mc-chart-border)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--mc-text-muted)" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "var(--mc-text-muted)" }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="enrollments" fill="#FFB6C1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mc-card">
                            <p className="mc-card-title">Avg score per assignment</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--mc-border)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--mc-text-muted)" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "var(--ms-text-muted)" }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="avg" stroke="#BA68C8" strokeWidth={2} dot={{ r: 4, fill: "#BA68C8" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mc-charts-row">
                        <ActivityDonut data={donutData} />
                        <div className="mc-card mc-rec-card">
                            <p className="mc-card-title">My Recommendations for the child</p>
                            {recommendations.length === 0 ? (
                                <div className="mc-rec-empty">
                                    <span className="mc-rec-empty-icon">✦</span>
                                    <span>No recommendations yet</span>
                                </div>
                            ) : (
                                <div className="mc-rec-list">
                                    {recommendations.map((rec) => (
                                        <div key={rec.id} className="mc-rec-item">
                                            <div className="mc-rec-dot" style={{ background: `#${rec.category?.color}` || '#EC4899' }} />
                                            <div className="mc-rec-info">
                                                <span className="mc-rec-title">{rec.contentTitle}</span>
                                                <span className="mc-rec-sub">{rec.category?.name}{rec.subCategory ? ` · ${rec.subCategory.name}` : ''}</span>
                                            </div>
                                            <span className={`mc-rec-badge ${rec.viewed ? '--seen' : '--new'}`}>
                                                {rec.viewed ? 'Seen' : 'New'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {addChildClicked && <AddChild onClose={() => setAddChildClicked(false)} />}
        </div>
    )
}

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
        <div className="mc-card">
            <p className="mc-card-title">Student activity breakdown</p>
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

export default MyChildren
