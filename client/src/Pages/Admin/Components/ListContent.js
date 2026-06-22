import React, { useState } from "react";
import "../Styles/ListUsers.css";
import { useNavigate } from "react-router-dom";

const COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517", 
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getCategoryColor = (id) => COLORS[Number(id) % COLORS.length];

function CategoryBadge({ name, color }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: "0.75rem",
            fontWeight: 600,
            background: `${color}18`,
            color: color,
            border: `0.5px solid ${color}40`,
        }}>
            {name}
        </span>
    );
}

function TypeBadge({ type }) {
    const isCourse = type === "course";
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: "0.72rem",
            fontWeight: 600,
            background: isCourse ? "#E6F1FB" : "#EEEDFE",
            color: isCourse ? "#185FA5" : "#534AB7",
        }}>
            {isCourse ? "Course" : "Assignment"}
        </span>
    );
}

export default function ListContent({ data }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("title");
    const [sortDir, setSortDir] = useState("asc");

    const items = data || [];

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="ls-sort-icon ls-sort-idle">↕</span>;
        return <span className="ls-sort-icon ls-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const filtered = items
        .filter(item => {
            const q = search.toLowerCase();
            const teacherName = `${item.teacher?.givenName} ${item.teacher?.familyName}`.toLowerCase();
            return (
                item.title?.toLowerCase().includes(q) ||
                teacherName.includes(q) ||
                item.category?.name?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            let va, vb;
            if (sortKey === "title")    { va = a.title;          vb = b.title; }
            if (sortKey === "teacher")  { va = a.teacher?.familyName; vb = b.teacher?.familyName; }
            if (sortKey === "enroll")   { va = a.enrollCount ?? a.solveCount ?? 0; vb = b.enrollCount ?? b.solveCount ?? 0; }
            if (sortKey === "rating")   { va = a.avgRating ?? 0;  vb = b.avgRating ?? 0; }
            if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === "asc" ? va - vb : vb - va;
        });

        const navigate = useNavigate()

    return (
        <div className="ls-wrapper">
            {/* Toolbar */}
            <div className="ls-toolbar">
                <div className="ls-search-box">
                    <svg className="ls-search-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        className="ls-search"
                        placeholder="Search by title, teacher or category..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <span className="ls-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Table */}
            <div className="ls-table-wrap">
                <table className="ls-table">
                    <thead>
                        <tr>
                            <th className="ls-th" style={{ width: 40 }}>#</th>
                            <th className="ls-th" style={{ width: 90 }}>Type</th>
                            <th className="ls-th ls-th-sortable" onClick={() => handleSort("title")} style={{width: "30%"}}>
                                Title <SortIcon col="title" />
                            </th>
                            <th className="ls-th ls-th-sortable" onClick={() => handleSort("teacher")}>
                                Teacher <SortIcon col="teacher" />
                            </th>
                            <th className="ls-th ls-th-center">Category</th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("enroll")}>
                                Enrollments / Solutions <SortIcon col="enroll" />
                            </th>
                            <th className="ls-th" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="ls-empty">No content found</td>
                            </tr>
                        ) : (
                            filtered.map((item, i) => {
                                const isCourse = item.typeContent === "course";
                                const catColor = getCategoryColor(item.category?.idSubject ?? i);
                                const teacherName = `${item.teacher?.givenName ?? ""} ${item.teacher?.familyName ?? ""}`.trim();
                                const count = isCourse ? item.enrollCount : item.solveCount;

                                return (
                                    <tr key={item._id} className="ls-row">
                                        <td className="ls-td ls-td-rank">{i + 1}</td>

                                        <td className="ls-td" style={{width: "20%"}}>
                                            <TypeBadge type={item.typeContent} />
                                        </td>

                                        <td className="ls-td" style={{width: "40%"}}>
                                            <span className="ls-name" title={item.title}>
                                                {item.title || "—"}
                                            </span>
                                        </td>

                                        <td className="ls-td ls-td-muted">
                                            {teacherName || "—"}
                                        </td>

                                        <td className="ls-td" style={{ textAlign: "center" }}>
                                            {item.category?.name
                                                ? <CategoryBadge name={item.category.name} color={catColor} />
                                                : <span className="ls-td-muted">—</span>
                                            }
                                        </td>

                                        <td className="ls-td" style={{ textAlign: "center" }}>
                                            <span className="ls-chip">
                                                {count ?? 0} {isCourse ? "enrolled" : "solved"}
                                            </span>
                                        </td>

                                        <td className="ls-td ls-td-action">
                                            <button 
                                            className="ls-view-btn"
                                            onClick={() => navigate(`/courses/${item._id}?type=${item.typeContent}`) }
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
        </div>
    );
}