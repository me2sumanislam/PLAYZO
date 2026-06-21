 // page/Admin/TransactionHistory/TransactionHistory.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Deposit + Withdraw History — একটাই component, ভেতরে tab দিয়ে আলাদা
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import { api, fmt, timeAgo } from "../../../utils/adminApi";

const STATUS = {
  pending:  { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
};

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

const TransactionHistory = () => {
  const [tab,     setTab]     = useState("deposit");  // "deposit" | "withdraw"
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");      // "all" | "pending" | "approved" | "rejected"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path = tab === "withdraw"
        ? "/withdraw/admin/all?limit=100"
        : "/admin/deposits?limit=100";
      const d = await api(path);
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((r) => {
    const name = (r.userName || r.name || r.user?.name || r.user?.phone || "").toLowerCase();
    const phone = (r.phone || r.user?.phone || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  // Summary stats
  const total    = list.length;
  const approved = list.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount || 0), 0);
  const pending  = list.filter(r => r.status === "pending").length;

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>📜 Transaction History</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>সব deposit এবং withdraw এর রেকর্ড</p>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: "flex", gap: 0, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[
          { id: "deposit",  label: "💰 Deposit" },
          { id: "withdraw", label: "🏧 Withdraw" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); setFilter("all"); }}
            style={{
              padding: "9px 22px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#111" : "#6b7280",
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "মোট Record", val: total, bg: "#eff6ff", color: "#1e40af" },
          { label: "Approved Amount", val: fmt(approved), bg: "#d1fae5", color: "#065f46" },
          { label: "Pending Request", val: pending, bg: "#fef3c7", color: "#92400e" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, marginTop: 3 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 নাম বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          🔄
        </button>
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
        {filtered.length} টি রেকর্ড দেখাচ্ছে
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>⏳ লোড হচ্ছে...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", border: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, color: "#374151" }}>কোনো রেকর্ড নেই</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r) => (
            <div key={r._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>

              {/* Method Icon */}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: tab === "deposit" ? "#d1fae5" : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {tab === "deposit" ? "💰" : "🏧"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 2 }}>
                  {r.userName || r.name || r.user?.name || "Unknown"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {(r.method || "—").toUpperCase()} ·{" "}
                  {tab === "deposit" ? `TrxID: ${r.trxId || "—"}` : `A/C: ${r.accountNo || "—"}`}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {fmtDate(r.createdAt)}
                </div>
              </div>

              {/* Amount + Status */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: tab === "deposit" ? "#065f46" : "#7c3aed", marginBottom: 4 }}>
                  {fmt(r.amount)}
                </div>
                <Badge status={r.status || "pending"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;