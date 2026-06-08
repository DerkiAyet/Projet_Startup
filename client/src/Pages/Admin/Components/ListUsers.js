import React, { useState } from "react";
import "../Styles/ListUsers.css";

const COLORS = [
    "#378ADD", "#7F77DD", "#1D9E75", "#BA7517",
    "#D85A30", "#C2487E", "#2AADBB", "#8B5CF6",
];

const getUserColor = (userId) => COLORS[Number(userId) % COLORS.length];

function Avatar({ initials, color }) {
    return (
        <div className="ls-avatar" style={{ background: `${color}18`, color }}>
            {initials}
        </div>
    );
}

function StatusBadge({ isActive }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: "0.75rem",
            fontWeight: 600,
            background: isActive ? "#EAF3DE" : "#FDECEA",
            color: isActive ? "#3B6D11" : "#9B2516",
        }}>
            {isActive ? "Active" : "Inactive"}
        </span>
    );
}

export default function ListUsers({ data, role }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    // sync with parent tab switch
    const users = data || [];

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="ls-sort-icon ls-sort-idle">↕</span>;
        return <span className="ls-sort-icon ls-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const filtered = users
        .filter(u => {
            const q = search.toLowerCase();
            return (
                u.givenName?.toLowerCase().includes(q) ||
                u.familyName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.userName?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            let va, vb;
            if (sortKey === "name")   { va = a.familyName; vb = b.familyName; }
            if (sortKey === "joined") { va = a.createdAt;  vb = b.createdAt;  }
            if (sortKey === "status") { va = a.isActive ? 1 : 0; vb = b.isActive ? 1 : 0; }
            if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === "asc" ? va - vb : vb - va;
        });

    const formatDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });
    };

    return (
        <div className="ls-wrapper">
            <div className="ls-toolbar">
                <div className="ls-search-box">
                    <svg className="ls-search-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        className="ls-search"
                        placeholder={`Search ${role || "users"}...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <span className="ls-count">{filtered.length} {role || "user"}{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="ls-table-wrap">
                <table className="ls-table">
                    <thead>
                        <tr>
                            <th className="ls-th" style={{ width: 40 }}>#</th>
                            <th className="ls-th ls-th-sortable" onClick={() => handleSort("name")}>
                                Name <SortIcon col="name" />
                            </th>
                            <th className="ls-th">Email</th>
                            <th className="ls-th">Username</th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("joined")}>
                                Joined <SortIcon col="joined" />
                            </th>
                            <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("status")}>
                                Status <SortIcon col="status" />
                            </th>
                            <th className="ls-th" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="ls-empty">No users found</td>
                            </tr>
                        ) : (
                            filtered.map((u, i) => {
                                const color = getUserColor(u.id);
                                const initials = `${u.givenName?.[0] || ""}${u.familyName?.[0] || ""}`.toUpperCase();
                                return (
                                    <tr key={u.id} className="ls-row">
                                        <td className="ls-td ls-td-rank">{i + 1}</td>
                                        <td className="ls-td">
                                            <div className="ls-name-cell">
                                                <Avatar initials={initials} color={color} />
                                                <span className="ls-name">{u.givenName} {u.familyName}</span>
                                            </div>
                                        </td>
                                        <td className="ls-td ls-td-muted">{u.email || "—"}</td>
                                        <td className="ls-td">
                                            <span className="ls-chip">@{u.userName}</span>
                                        </td>
                                        <td className="ls-td" style={{ textAlign: "center" }}>
                                            <span className="ls-chip">{formatDate(u.createdAt)}</span>
                                        </td>
                                        <td className="ls-td" style={{ textAlign: "center" }}>
                                            <StatusBadge isActive={u.isActive} />
                                        </td>
                                        <td className="ls-td ls-td-action">
                                            <button className="ls-view-btn">
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