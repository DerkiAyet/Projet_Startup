import React, { useState, useEffect } from 'react'
import "../Styles/Reports.css"
import "../Styles/ListUsers.css"
import axios from "axios"
import { useNavigate } from 'react-router-dom';
import ViewPost from '../Components/ViewPost';

const COLORS = {
  post: { color: "#378ADD", bg: "#EAF4FF" },
  content: { color: "#1D9E75", bg: "#E8F8F2" },
  user: { color: "#C2487E", bg: "#FCECF3" },
  comment: { color: "#BA7517", bg: "#FFF4E5" }
};

const DEFAULT_COLOR = { color: "#6B7280", bg: "#F3F4F6" };

const ROLE_COLORS = {
  student: { color: "#1D9E75", bg: "#E8F8F2" },
  teacher: { color: "#378ADD", bg: "#EAF4FF" },
  parent: { color: "#7F77DD", bg: "#F1EEFF" },
  admin: { color: "#C2487E", bg: "#FCECF3" }
};

function TypeBadge({ type }) {
  const category = COLORS[type] || DEFAULT_COLOR;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "0.72rem", fontWeight: 600,
      backgroundColor: category.bg, color: category.color, textTransform: "capitalize"
    }}>
      {type}
    </span>
  );
}

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || DEFAULT_COLOR;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "0.72rem", fontWeight: 600,
      backgroundColor: c.bg, color: c.color, textTransform: "capitalize"
    }}>
      {role}
    </span>
  );
}

function StatusBadge({ processed }) {
  const done = processed !== null && processed !== undefined;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "0.72rem", fontWeight: 600,
      backgroundColor: done ? "#E8F8F2" : "#FFF4E5",
      color: done ? "#1D9E75" : "#BA7517"
    }}>
      {done ? "Processed" : "Pending"}
    </span>
  );
}

function Reports() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL_GATEWAY}/content-hub/reports`,
          { withCredentials: true, timeout: 3000 }
        );
        setReports(res.data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false)
      }
    };
    fetchData();
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="ls-sort-icon ls-sort-idle">↕</span>;
    return <span className="ls-sort-icon ls-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const filtered = reports
    .filter(item => {
      const q = search.toLowerCase();
      const reporterName = `${item.reportedBy?.givenName ?? ""} ${item.reportedBy?.familyName ?? ""}`.toLowerCase();
      return (
        item.about?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        reporterName.includes(q) ||
        item.reportedBy?.userName?.toLowerCase().includes(q) ||
        item.reportedBy?.role?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let va, vb;
      if (sortKey === "date") {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      } else if (sortKey === "reporter") {
        va = `${a.reportedBy?.givenName} ${a.reportedBy?.familyName}`.toLowerCase();
        vb = `${b.reportedBy?.givenName} ${b.reportedBy?.familyName}`.toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      } else if (sortKey === "about") {
        va = a.about?.toLowerCase() ?? "";
        vb = b.about?.toLowerCase() ?? "";
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      } else if (sortKey === "status") {
        va = a.processedByAdmin !== null ? 1 : 0;
        vb = b.processedByAdmin !== null ? 1 : 0;
      } else {
        va = a.id; vb = b.id;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const navigate = useNavigate()
  const [openPost, setOpenPost] = useState({
    visible: false,
    postId: null, 
    reportId: null
  })

  const navigateTo = (type, refId, refType, reportId) => {
    if (type === "post") {
      setOpenPost({ visible: true, postId: refId, reportId: reportId })
    } else if (type === "content") {
      navigate(`/courses/${refId}?type=${refType}&reportId=${reportId}`)
    } else if (type === "user") {
      navigate(`users/${refId}/profile?reportId=${reportId}`)
    } else {
      // go to comment
    }
  }

  return (
    <div className='reports-container'>
      <div className="reports-wrapper">
        <div className="reports-header">
          <div className="reports-header-left">
            <h1 className="reports-title">Reports</h1>
            <p className="reports-subtitle">Monitor reported content, investigate issues, and take appropriate actions.</p>
          </div>

        </div>
        <div className="ls-toolbar">
          <div className="ls-search-box">
            <svg className="ls-search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="ls-search"
              placeholder="Search by type, message or user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="ls-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th className="ls-th" style={{ width: 40 }}>#</th>
                <th className="ls-th ls-th-sortable" onClick={() => handleSort("about")} style={{ width: 90 }}>
                  Type <SortIcon col="about" />
                </th>
                <th className="ls-th" style={{ width: "25%" }}>Message</th>
                <th className="ls-th ls-th-sortable" onClick={() => handleSort("reporter")}>
                  Reported By <SortIcon col="reporter" />
                </th>
                <th className="ls-th ls-th-center">Role</th>
                <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("date")}>
                  Date <SortIcon col="date" />
                </th>
                <th className="ls-th ls-th-sortable ls-th-center" onClick={() => handleSort("status")}>
                  Status <SortIcon col="status" />
                </th>
                <th className="ls-th" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="ls-empty">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="ls-empty">No reports found</td></tr>
              ) : (
                filtered.map((item, i) => {
                  const reporter = item.reportedBy;
                  const reporterName = `${reporter?.givenName ?? ""} ${reporter?.familyName ?? ""}`.trim();
                  const date = new Date(item.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric"
                  });

                  return (
                    <tr key={item.id} className="ls-row">
                      <td className="ls-td ls-td-rank">{i + 1}</td>

                      <td className="ls-td">
                        <TypeBadge type={item.about} />
                      </td>

                      <td className="ls-td" style={{ maxWidth: 220 }}>
                        <span className="ls-name" title={item.message}>
                          {item.message || "—"}
                        </span>
                      </td>

                      <td className="ls-td">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <div className="ls-name">{reporterName || "—"}</div>
                            <div className="ls-td-muted" style={{ fontSize: "0.72rem" }}>@{reporter?.userName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="ls-td" style={{ textAlign: "center" }}>
                        <RoleBadge role={reporter?.role} />
                      </td>

                      <td className="ls-td ls-td-muted" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {date}
                      </td>

                      <td className="ls-td" style={{ textAlign: "center" }}>
                        <StatusBadge processed={item.processedByAdmin} />
                      </td>
                      <td className="ls-td ls-td-action">
                        <button
                          className="ls-view-btn"
                          onClick={() => navigateTo(item.about, item.refId, item.refType, item.id)}
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
      {
        openPost.visible &&
        <ViewPost
          visible={openPost.visible}
          postId={openPost.postId}
          onClose={() => setOpenPost({ visible: false, postId: null })}
          reportId={openPost.reportId}
        />
      }
    </div>
  );
}

export default Reports;