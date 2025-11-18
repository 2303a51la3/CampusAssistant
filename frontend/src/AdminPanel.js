// src/AdminPanel.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminPanel.css";

const API_BASE = "http://localhost:5000";

function AdminPanel() {
  const [faqs, setFaqs] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    question: "",
    answer: "",
    tags: "",
    department: "all",
    year: "all",
  });

  const [stats, setStats] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);

  // filters & pagination for history
  const [searchText, setSearchText] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadFaqs = async () => {
    const res = await axios.get(`${API_BASE}/api/faqs`);
    setFaqs(res.data);
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/stats/summary`);
      setStats(res.data);
    } catch (err) {
      console.error("Error loading stats", err);
    }
  };

  const loadChatLogs = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/chatlogs/recent?limit=200`
      );
      setChatLogs(res.data);
    } catch (err) {
      console.error("Error loading chat logs", err);
    }
  };

  useEffect(() => {
    loadFaqs();
    loadStats();
    loadChatLogs();
  }, []);

  // ===== FORM HANDLERS =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      question: form.question,
      answer: form.answer,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      department: form.department,
      year: form.year,
    };

    if (editingId) {
      await axios.put(`${API_BASE}/api/faqs/${editingId}`, payload);
    } else {
      await axios.post(`${API_BASE}/api/faqs`, payload);
    }

    setForm({
      question: "",
      answer: "",
      tags: "",
      department: "all",
      year: "all",
    });
    setEditingId(null);
    loadFaqs();
    loadStats();
    loadChatLogs();
  };

  const handleEdit = (faq) => {
    setEditingId(faq._id);
    setForm({
      question: faq.question || "",
      answer: faq.answer || "",
      tags: (faq.tags || []).join(", "),
      department: faq.department || "all",
      year: faq.year || "all",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    await axios.delete(`${API_BASE}/api/faqs/${id}`);
    loadFaqs();
    loadStats();
    loadChatLogs();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      question: "",
      answer: "",
      tags: "",
      department: "all",
      year: "all",
    });
  };

  // ===== DISPLAY HELPERS =====
  const displayDept = (dept) => {
    if (!dept || dept === "all") return "All";
    return dept.toUpperCase();
  };

  const displayYear = (yr) => {
    if (!yr || yr === "all") return "All";
    return `${yr} year`;
  };

  const formatDateTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getDateOnly = (dt) => {
    if (!dt) return "";
    return new Date(dt).toISOString().slice(0, 10);
  };

  // ====== FILTERED + PAGINATED LOGS ======
  const filteredLogs = chatLogs.filter((log) => {
    // search in question + matched FAQ
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const combined = `${log.message || ""} ${
        log.faqId && log.faqId.question ? log.faqId.question : ""
      }`.toLowerCase();
      if (!combined.includes(q)) return false;
    }

    // dept filter
    if (filterDept !== "all" && log.department !== filterDept) return false;

    // year filter
    if (filterYear !== "all" && log.year !== filterYear) return false;

    // tag filter – uses tags from matched FAQ if available
    if (filterTag !== "all") {
      const tags = (log.faqId && log.faqId.tags) || [];
      if (!tags.includes(filterTag)) return false;
    }

    // date range filter
    const logDate = getDateOnly(log.createdAt);
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleLogs = filteredLogs.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchText, filterDept, filterYear, filterTag, startDate, endDate]);

  // ====== EXPORT CSV ======
  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      alert("No data to export.");
      return;
    }

    const header = [
      "Time",
      "Department",
      "Year",
      "Student Question",
      "Matched FAQ",
      "Tags",
    ];

    const rows = filteredLogs.map((log) => {
      const tags = (log.faqId && log.faqId.tags) || [];
      return [
        formatDateTime(log.createdAt),
        displayDept(log.department),
        displayYear(log.year),
        (log.message || "").replace(/\n/g, " "),
        log.faqId && log.faqId.question
          ? log.faqId.question.replace(/\n/g, " ")
          : "",
        tags.join("|"),
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sru_chat_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <h1>SRU Campus Assistant – Admin Panel</h1>

      {/* Analytics cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Queries today</div>
            <div className="stat-value">{stats.totalToday}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total queries</div>
            <div className="stat-value">{stats.totalAllTime}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Top department</div>
            <div className="stat-value">
              {stats.byDept && stats.byDept.length
                ? (stats.byDept[0]._id || "All").toUpperCase()
                : "—"}
            </div>
            <div className="stat-sub">
              {stats.byDept && stats.byDept.length
                ? `${stats.byDept[0].count} queries`
                : ""}
            </div>
          </div>

          <div className="stat-card wide">
            <div className="stat-label">Most asked question</div>
            <div className="stat-value-sm">
              {stats.topFaqs && stats.topFaqs.length
                ? stats.topFaqs[0].question
                : "—"}
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout">
        {/* Left: form */}
        <div className="admin-form-card">
          <h2>{editingId ? "Edit FAQ" : "Add New FAQ"}</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Question
              <textarea
                name="question"
                value={form.question}
                onChange={handleChange}
                required
                rows={2}
              />
            </label>

            <label>
              Answer
              <textarea
                name="answer"
                value={form.answer}
                onChange={handleChange}
                required
                rows={3}
              />
            </label>

            <label>
              Tags (comma separated)
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="exam, schedule"
              />
            </label>

            <label>
              Department
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="all">All Departments</option>
                <option value="cse">CSE</option>
                <option value="ece">ECE</option>
                <option value="eee">EEE</option>
                <option value="civil">CIVIL</option>
                <option value="mech">MECH</option>
                <option value="other">OTHER</option>
              </select>
            </label>

            <label>
              Year
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </label>

            <div className="admin-buttons">
              <button type="submit">
                {editingId ? "Update FAQ" : "Add FAQ"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: list */}
        <div className="admin-list-card">
          <h2>Existing FAQs</h2>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Tags</th>
                <th>Dept / Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f._id}>
                  <td>{f.question}</td>
                  <td>{(f.tags || []).join(", ")}</td>
                  <td>
                    {displayDept(f.department)} / {displayYear(f.year)}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(f)}>Edit</button>
                    <button onClick={() => handleDelete(f._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!faqs.length && (
                <tr>
                  <td colSpan="4">No FAQs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="admin-note">
            * Use Department = “All” and Year = “All” for common answers.
          </p>
        </div>
      </div>

      {/* ================= CHAT HISTORY SECTION ================= */}
      <div className="history-card">
        <div className="history-header">
          <h2>Recent Chat History</h2>
          <button className="history-refresh" onClick={loadChatLogs}>
            Refresh
          </button>
        </div>

        {/* Filters row */}
        <div className="history-filters">
          <input
            className="history-search"
            type="text"
            placeholder="Search question or answer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="all">All Depts</option>
            <option value="cse">CSE</option>
            <option value="ece">ECE</option>
            <option value="eee">EEE</option>
            <option value="civil">CIVIL</option>
            <option value="mech">MECH</option>
            <option value="other">OTHER</option>
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="1">1st</option>
            <option value="2">2nd</option>
            <option value="3">3rd</option>
            <option value="4">4th</option>
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            <option value="exam">exam</option>
            <option value="placement">placement</option>
            <option value="project">project</option>
            <option value="faculty">faculty</option>
            <option value="graduation">graduation</option>
            <option value="hostel">hostel</option>
            <option value="library">library</option>
          </select>

          <div className="history-date-range">
            <label>
              From
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>

          <button className="history-export" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>

        <table className="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Dept / Year</th>
              <th>Student Question</th>
              <th>Matched FAQ</th>
            </tr>
          </thead>

          <tbody>
            {visibleLogs.map((log) => (
              <tr key={log._id}>
                <td>{formatDateTime(log.createdAt)}</td>
                <td>
                  {displayDept(log.department)} / {displayYear(log.year)}
                </td>
                <td>{log.message}</td>
                <td>
                  {log.faqId && log.faqId.question
                    ? log.faqId.question
                    : "No exact FAQ matched"}
                </td>
              </tr>
            ))}
            {!visibleLogs.length && (
              <tr>
                <td colSpan="4">No chat history found for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="history-pagination">
          <span>
            Showing{" "}
            {filteredLogs.length
              ? `${startIndex + 1}-${Math.min(
                  startIndex + PAGE_SIZE,
                  filteredLogs.length
                )}`
              : "0"}{" "}
            of {filteredLogs.length} records
          </span>
          <div className="history-pagination-buttons">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
