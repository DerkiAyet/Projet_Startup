import React, { useState, useEffect } from 'react'
import '../Styles/Dashboard.css'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="dashboard-tooltip">
        <p className="dashboard-tooltip-label">{label}</p>
        <p className="dashboard-tooltip-value">
          {payload[0].value} {unit}
        </p>
      </div>
    );
  }
  return null;
};

function ActivityDonut({ data = [] }) {
  if (!data?.length) return null;

  const COLORS = ["#16A085", "#BA68C8", "#EC4899", "#F59E0B", "#3B82F6"];

  const items = data.map((d, i) => ({
    name: d.name,
    value: d.count,
    color: COLORS[i % COLORS.length],
  }));

  const total = items.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="dashboard-card">
      <p className="dashboard-card-title">Educational content breakdown</p>

      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>

        {/* Donut */}
        <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
          <PieChart width={180} height={180}>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={3}
            >
              {items.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => {
                const percent = total ? Math.round((value / total) * 100) : 0;
                return [`${value} (${percent}%)`, name];
              }}
            />
          </PieChart>

          {/* Center label */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 600 }}>
              {total}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              total items
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => (
            <div key={item.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: item.color,
                  }}
                />
                <span style={{ fontSize: 13, opacity: 0.7 }}>
                  {item.name}
                </span>
              </div>

              <div style={{ paddingLeft: 18, display: "flex", gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 600 }}>
                  {item.value}
                </span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                  {total ? Math.round((item.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, sub, accent }) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-accent" style={{ background: `${accent}18` }}>
        <div className="dashboard-stat-dot" style={{ background: accent }} />
      </div>
      <div className="dashboard-stat-body">
        <span className="dashboard-stat-value">{value}</span>
        <span className="dashboard-stat-label">{label}</span>
        <span className="dashboard-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({});
  const [barData, setBarData] = useState([]);
  const [reportsBarData, setReportsBarData] = useState([])
  const [usersStat, setUsersStat] = useState([]);
  const [activityBreakdown, setActivityBreakdown] = useState(null);

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const userRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/analytics/stats`)
        setStats((prev) => ({ ...prev, users: userRes.data.totalUsers }))
        setBarData(userRes.data.details)

        const postsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/analytics/stats`)
        setStats((prev) => ({ ...prev, posts: postsRes.data }))

        const contentRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content/analytics/stats`)
        setStats((prev) => ({ ...prev, eduContent: contentRes.data.totalCount }))
        setActivityBreakdown(contentRes.data.details)

        const reportsRes = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/reports/admin/stats`)
        setStats((prev) => ({ ...prev, reports: reportsRes.data.totalCount }))
        setReportsBarData(reportsRes.data.details)

      } catch (error) {
        console.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData();
  }, [])

  const [date, setDate] = useState(new Date());

  if (loading) {
    return (
      <div className='dashboard-container'>
        <div className="search-loading">
          <div className="loading-spinner" />
          <span>Fetching data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='dashboard-container'>
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of platform activity and key metrics</p>
        </div>
      </div>
      <div className="dashboard-stats-row">
        <StatCard value={stats?.users} label="Total Users" sub="Across platform" accent="#EC4899" />
        <StatCard value={stats?.eduContent} label="Educational Content" sub="Courses, assignments, tips & quizzes" accent="#BA68C8" />
        <StatCard value={stats?.posts} label="Social Posts" sub="Created by users" accent="#16A085" />
        <StatCard value={stats?.reports} label="Reports" sub="Reported about any content" accent="#A01616" />
      </div>

      <div className="dashboard-charts-row">
        <div className="dashboard-card">
          <p className="dashboard-card-title">Users per role</p>
          <ResponsiveContainer width="100%" height={"100%"}>
            <BarChart data={barData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--dashboard-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--dashboard-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip unit='users' />} />
              <Bar dataKey="count" fill="#FFB6C1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ActivityDonut data={activityBreakdown} />
      </div>

      <div className="dashboard-charts-row">
        <div className="dashboard-card">
          <p className="dashboard-card-title">Reports per category</p>
          <ResponsiveContainer width="100%" height={"100%"}>
            <BarChart data={reportsBarData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--dashboard-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--dashboard-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip unit='reports' />} />
              <Bar dataKey="count" fill="#A01616" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-card" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <p className="dashboard-card-title">Calendar</p>
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <Calendar onChange={setDate} value={date} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
