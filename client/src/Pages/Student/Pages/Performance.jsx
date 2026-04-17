import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../../App";
import "../Styles/Activity.css";
import { ReactComponent as CourseIcon } from '../../../Assets/icons/CourseIcons/lessons-course.svg';
import { ReactComponent as AssignmentIcon } from '../../../Assets/icons/CourseIcons/target-icon.svg';
import { ReactComponent as QuizIcon } from '../../../Assets/icons/CourseIcons/bar-chart.svg';
import { ReactComponent as TimeIcon } from '../../../Assets/icons/CourseIcons/timer-icon.svg';
import { ReactComponent as TrophyIcon } from '../../../Assets/icons/TimelineIcons/full-heart.svg';

// Simple chart components using SVG (no external libraries needed)
const ProgressChart = ({ percentage, color }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
            />
            <circle
                cx="90"
                cy="90"
                r={radius}
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
            <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="700" fill="#1E293B">
                {percentage}%
            </text>
            <text x="90" y="110" textAnchor="middle" fontSize="12" fill="#8E8E8E">
                Completed
            </text>
        </svg>
    );
};

const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="bar-chart">
            <h4 className="chart-title">{title}</h4>
            <div className="bars-container">
                {data.map((item, index) => (
                    <div key={index} className="bar-item">
                        <div className="bar-label">{item.label}</div>
                        <div className="bar-wrapper">
                            <div 
                                className="bar-fill" 
                                style={{ 
                                    width: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: item.color || "#EC4899"
                                }}
                            />
                        </div>
                        <div className="bar-value">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivityTimeline = ({ activities }) => {
    return (
        <div className="timeline">
            <h4 className="timeline-title">Recent Activity</h4>
            <div className="timeline-items">
                {activities.map((activity, index) => (
                    <div key={index} className="timeline-item">
                        <div className="timeline-dot" style={{ backgroundColor: activity.color }} />
                        <div className="timeline-content">
                            <div className="timeline-header">
                                <span className="timeline-type">{activity.type}</span>
                                <span className="timeline-date">{activity.date}</span>
                            </div>
                            <div className="timeline-title-text">{activity.title}</div>
                            {activity.score && (
                                <div className="timeline-score">Score: {activity.score}%</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="stats-card">
        <div className="stats-icon" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon />
        </div>
        <div className="stats-info">
            <div className="stats-value">{value}</div>
            <div className="stats-title">{title}</div>
            {subtitle && <div className="stats-subtitle">{subtitle}</div>}
        </div>
    </div>
);

export default function Performance() {
    const { userAuth } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("week");

    // Local mock data
    const mockData = {
        enrolledCourses: [
            { id: 1, title: "React Fundamentals", lessons: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }] },
            { id: 2, title: "JavaScript Mastery", lessons: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] },
            { id: 3, title: "Node.js Backend", lessons: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }] },
            { id: 4, title: "Python Programming", lessons: [{ id: 1 }, { id: 2 }, { id: 3 }] }
        ],
        completedLessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        solvedAssignments: [
            { id: 1, title: "React Components", score: 92 },
            { id: 2, title: "JavaScript Functions", score: 88 },
            { id: 3, title: "Node.js API", score: 78 },
            { id: 4, title: "Python OOP", score: 95 }
        ],
        quizResults: [
            { id: 1, title: "React Quiz", score: 95 },
            { id: 2, title: "JavaScript Quiz", score: 82 },
            { id: 3, title: "Node.js Quiz", score: 88 },
            { id: 4, title: "Python Quiz", score: 91 }
        ],
        totalStudyTime: 47,
        categoryProgress: [
            { name: "React", progress: 85, color: "#EC4899" },
            { name: "JavaScript", progress: 72, color: "#F59E0B" },
            { name: "Node.js", progress: 60, color: "#10B981" },
            { name: "Python", progress: 90, color: "#6366F1" }
        ]
    };

    // Calculate stats from mock data
    const totalLessons = mockData.enrolledCourses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const completionRate = totalLessons > 0 ? Math.round((mockData.completedLessons.length / totalLessons) * 100) : 0;
    
    const allScores = [...mockData.solvedAssignments.map(a => a.score), ...mockData.quizResults.map(q => q.score)];
    const averageScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    // Weekly progress data (changes based on selected period)
    const getWeeklyProgress = () => {
        switch(selectedPeriod) {
            case "week":
                return [
                    { label: "Mon", value: 65, color: "#EC4899" },
                    { label: "Tue", value: 72, color: "#EC4899" },
                    { label: "Wed", value: 80, color: "#EC4899" },
                    { label: "Thu", value: 78, color: "#EC4899" },
                    { label: "Fri", value: 85, color: "#EC4899" },
                    { label: "Sat", value: 90, color: "#EC4899" },
                    { label: "Sun", value: 88, color: "#EC4899" }
                ];
            case "month":
                return [
                    { label: "Week 1", value: 45, color: "#EC4899" },
                    { label: "Week 2", value: 62, color: "#EC4899" },
                    { label: "Week 3", value: 78, color: "#EC4899" },
                    { label: "Week 4", value: 85, color: "#EC4899" }
                ];
            default:
                return [
                    { label: "Jan", value: 45, color: "#EC4899" },
                    { label: "Feb", value: 52, color: "#EC4899" },
                    { label: "Mar", value: 68, color: "#EC4899" },
                    { label: "Apr", value: 72, color: "#EC4899" },
                    { label: "May", value: 78, color: "#EC4899" },
                    { label: "Jun", value: 85, color: "#EC4899" }
                ];
        }
    };

    // Recent activities
    const recentActivities = [
        { type: "Course", title: "Completed React Hooks lesson", date: "2024-01-15", score: null, color: "#10B981" },
        { type: "Assignment", title: "JavaScript Basics - Functions", date: "2024-01-14", score: 88, color: "#F59E0B" },
        { type: "Quiz", title: "React Fundamentals Quiz", date: "2024-01-13", score: 95, color: "#EC4899" },
        { type: "Course", title: "Started Node.js module", date: "2024-01-12", score: null, color: "#10B981" },
        { type: "Assignment", title: "Python OOP Project", date: "2024-01-11", score: 95, color: "#F59E0B" },
        { type: "Quiz", title: "JavaScript Advanced Quiz", date: "2024-01-10", score: 82, color: "#EC4899" }
    ];

    // Achievements
    const achievements = [
        { name: "Quick Learner", description: "Completed 5 lessons in a week", icon: "⚡" },
        { name: "Quiz Master", description: "Scored 90%+ on 3 quizzes", icon: "🏆" },
        { name: "Dedicated Student", description: "Studied 40+ hours total", icon: "📚" },
        { name: "Perfect Score", description: "Got 100% on an assignment", icon: "🎯" },
        { name: "Consistency King", description: "Active for 15 days straight", icon: "👑" }
    ];

    // Category distribution based on progress
    const categoryDistribution = mockData.categoryProgress.map(cat => ({
        label: cat.name,
        value: cat.progress,
        color: cat.color
    }));

    if (loading) {
        return (
            <div className="activity-loading">
                <div className="loading-spinner" />
                <span>Loading your activity...</span>
            </div>
        );
    }

    return (
        <div className="student-activity-container">
            <div className="activity-header">
                <h1>My Learning Activity</h1>
                <p>Track your progress and achievements</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatsCard 
                    icon={CourseIcon}
                    title="Courses Enrolled"
                    value={mockData.enrolledCourses.length}
                    subtitle="Active courses"
                    color="#EC4899"
                />
                <StatsCard 
                    icon={AssignmentIcon}
                    title="Assignments Solved"
                    value={mockData.solvedAssignments.length}
                    subtitle={`Avg: ${averageScore}%`}
                    color="#F59E0B"
                />
                <StatsCard 
                    icon={QuizIcon}
                    title="Quizzes Completed"
                    value={mockData.quizResults.length}
                    subtitle="Total attempts"
                    color="#10B981"
                />
                <StatsCard 
                    icon={TimeIcon}
                    title="Study Time"
                    value={`${mockData.totalStudyTime}h`}
                    subtitle="Total hours"
                    color="#6366F1"
                />
            </div>

            {/* Main Content Grid */}
            <div className="activity-grid">
                {/* Left Column */}
                <div className="activity-left">
                    {/* Completion Progress */}
                    <div className="activity-card progress-card">
                        <h3 className="card-title">Overall Progress</h3>
                        <div className="progress-chart-wrapper">
                            <ProgressChart percentage={completionRate} color="#EC4899" />
                        </div>
                        <div className="progress-stats">
                            <div className="stat-item">
                                <span className="stat-label">Lessons Completed</span>
                                <span className="stat-value">{mockData.completedLessons.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Total Lessons</span>
                                <span className="stat-value">{totalLessons}</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Activity Chart */}
                    <div className="activity-card">
                        <BarChart data={getWeeklyProgress()} title="Learning Activity" />
                    </div>

                    {/* Category Distribution */}
                    <div className="activity-card">
                        <h4 className="chart-title">Progress by Category</h4>
                        <div className="category-distribution">
                            {categoryDistribution.map((cat, idx) => (
                                <div key={idx} className="category-item">
                                    <div className="category-header">
                                        <span className="category-name" style={{ color: cat.color }}>{cat.label}</span>
                                        <span className="category-percentage">{cat.value}%</span>
                                    </div>
                                    <div className="category-bar">
                                        <div className="category-fill" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="activity-right">
                    {/* Achievements */}
                    <div className="activity-card achievements-card">
                        <h3 className="card-title">
                            <TrophyIcon className="card-icon" />
                            Achievements
                        </h3>
                        <div className="achievements-list">
                            {achievements.map((achievement, idx) => (
                                <div key={idx} className="achievement-item">
                                    <div className="achievement-icon">{achievement.icon}</div>
                                    <div className="achievement-info">
                                        <div className="achievement-name">{achievement.name}</div>
                                        <div className="achievement-desc">{achievement.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="activity-card">
                        <ActivityTimeline activities={recentActivities} />
                    </div>

                    {/* Top Performances */}
                    <div className="activity-card">
                        <h4 className="chart-title">Best Performances</h4>
                        <div className="performances-list">
                            {[...mockData.solvedAssignments, ...mockData.quizResults]
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 3)
                                .map((result, idx) => (
                                    <div key={idx} className="performance-item">
                                        <div className="performance-title">{result.title}</div>
                                        <div className="performance-score" style={{ color: result.score >= 80 ? "#10B981" : "#F59E0B" }}>
                                            {result.score}%
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}