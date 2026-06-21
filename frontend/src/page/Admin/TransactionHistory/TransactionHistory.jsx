 // src/page/Admin/TransactionHistory/TransactionHistory.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Deposit Requests + Withdraw Requests — একটাই component, tab দিয়ে আলাদা
// ✅ Approve / Reject button সহ, count badge সহ
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import { api, fmt, timeAgo } from "../../../utils/adminApi";

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:  { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
};

const Badge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
};

// ─── Date Formatter ───────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-BD", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "—";

// ─── Action Modal (Approve / Reject) ─────────────────────────────────────────
const ActionModal = ({ item, type, onClose, onDone }) => {
  const [note,          setNote]          = useState("");
  const [trxId,         setTrxId]         = useState("");
  const [rejectReason,  setRejectReason]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (type === "withdraw") {
        res = await api(`/withdraw/admin/approve/${item._id}`, {
          method: "PUT",
          body: JSON.stringify({ note: trxId ? `TrxID: ${trxId}` : note, trxId }),
        });
      } else {
        // Deposit approve — balance update হয়
        res = await api(`/admin/deposits/${item._id}/approve`, {
          method: "PUT",
          body: JSON.stringify({ note }),
        });
      }
      if (res?.success || res?.message?.toLowerCase().includes("success") || res?.status === "approved") {
        onDone("approved");
      } else {
        setError(res?.message || "Approve করা যায়নি");
      }
    } catch {
      setError("Server error");
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { setError("Reject কারণ লিখুন"); return; }
    setLoading(true);
    setError("");
    try {
      let res;
      if (type === "withdraw") {
        res = await api(`/withdraw/admin/reject/${item._id}`, {
          method: "PUT",
          body: JSON.stringify({ note: rejectReason }),
        });
      } else {
        res = await api(`/admin/deposits/${item._id}/reject`, {
          method: "PUT",
          body: JSON.stringify({ note: rejectReason }),
        });
      }
      if (res?.success || res?.message?.toLowerCase().includes("success") || res?.status === "rejected") {
        onDone("rejected");
      } else {
        setError(res?.message || "Reject করা যায়নি");
      }
    } catch {
      setError("Server error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 99999,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24,
        width: 420, maxWidth: "90vw", position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 14,
            background: "#f1f5f9", border: "none",
            width: 32, height: 32, borderRadius: "50%",
            fontSize: 14, cursor: "pointer", fontWeight: 700,
          }}
        >✕</button>

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
          {type === "withdraw" ? "🏧 Withdraw Request" : "💰 Deposit Request"}
        </div>

        {/* Info */}
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#6b7280" }}>User</span>
            <span style={{ fontWeight: 700 }}>
              {item.userName || item.name || item.user?.name || item.user?.phone || "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#6b7280" }}>Amount</span>
            <span style={{ fontWeight: 900, color: type === "deposit" ? "#065f46" : "#7c3aed", fontSize: 15 }}>
              {fmt(item.amount)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#6b7280" }}>Method</span>
            <span style={{ fontWeight: 600 }}>{(item.method || "—").toUpperCase()}</span>
          </div>
          {type === "withdraw" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Account</span>
              <span style={{ fontWeight: 600 }}>{item.accountNo || "—"}</span>
            </div>
          )}
          {type === "deposit" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>TrxID</span>
              <span style={{ fontWeight: 600 }}>{item.trxId || "—"}</span>
            </div>
          )}
        </div>

        {/* Approve Fields */}
        {type === "withdraw" && (
          <input
            placeholder="Transaction ID (approve করলে দিন)"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px", border: "1.5px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, marginBottom: 10, outline: "none",
            }}
          />
        )}

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", border: "1.5px solid #e5e7eb",
            borderRadius: 8, fontSize: 13, marginBottom: 10, outline: "none",
          }}
        />

        <input
          placeholder="❌ Reject কারণ (reject করলে দিন)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", border: "1.5px solid #fca5a5",
            borderRadius: 8, fontSize: 13, marginBottom: 14, outline: "none",
            background: "#fff5f5",
          }}
        />

        {error && (
          <div style={{
            background: "#fee2e2", color: "#dc2626",
            borderRadius: 8, padding: "8px 12px", fontSize: 12,
            marginBottom: 12, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              background: loading ? "#f3f4f6" : "#fee2e2",
              color: loading ? "#9ca3af" : "#991b1b",
              border: "none", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            ❌ Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 10,
              background: loading ? "#d1fae5" : "#059669",
              color: "#fff",
              border: "none", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "⏳ হচ্ছে..." : "✅ Approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TransactionHistory = ({ onBadgeUpdate }) => {
  // "deposit" = Deposit Requests, "withdraw" = Withdraw Requests
  const [tab,      setTab]      = useState("deposit");
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [modal,    setModal]    = useState(null);   // { item, type }
  const [toast,    setToast]    = useState("");

  // Count badges per tab
  const [depositPending,  setDepositPending]  = useState(0);
  const [withdrawPending, setWithdrawPending] = useState(0);

  // ── Load list ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path =
        tab === "withdraw"
          ? "/withdraw/admin/all?limit=200"
          : "/admin/deposits?limit=200";
      const d = await api(path);
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      setList(arr);

      // Update pending counts
      const pendingCount = arr.filter((r) => r.status === "pending").length;
      if (tab === "deposit")  setDepositPending(pendingCount);
      if (tab === "withdraw") setWithdrawPending(pendingCount);
    } catch {}
    setLoading(false);
  }, [tab]);

  // Load counts for both tabs independently (for badges)
  const loadAllBadges = useCallback(() => {
    api("/admin/deposits?limit=200")
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setDepositPending(arr.filter((r) => r.status === "pending").length);
      })
      .catch(() => {});
    api("/withdraw/admin/all?limit=200")
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setWithdrawPending(arr.filter((r) => r.status === "pending").length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAllBadges(); }, [loadAllBadges]);

  // ── After approve/reject ──────────────────────────────────────────────────
  const handleDone = (action) => {
    setModal(null);
    const verb = action === "approved" ? "✅ Approved" : "❌ Rejected";
    setToast(`${verb} সফলভাবে হয়েছে!`);
    setTimeout(() => setToast(""), 3000);
    load();
    loadAllBadges();
    onBadgeUpdate?.(); // Sidebar badge update করতে
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = list.filter((r) => {
    const name  = (r.userName || r.name || r.user?.name || r.user?.phone || "").toLowerCase();
    const phone = (r.phone || r.user?.phone || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalCount     = list.length;
  const approvedAmount = list
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const pendingCount   = list.filter((r) => r.status === "pending").length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "sticky", top: 10, zIndex: 100,
          background: "#1f2937", color: "#fff",
          padding: "10px 16px", borderRadius: 10,
          marginBottom: 14, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
          📜 Transaction History
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Deposit ও Withdraw request approve / reject করুন
        </p>
      </div>

      {/* ── Tab Toggle with badges ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 0,
        background: "#f3f4f6", borderRadius: 12,
        padding: 4, marginBottom: 20,
        width: "fit-content",
      }}>
        {[
          { id: "deposit",  label: "💰 Deposit Requests",  pending: depositPending  },
          { id: "withdraw", label: "🏧 Withdraw Requests", pending: withdrawPending },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); setFilter("all"); }}
            style={{
              position: "relative",
              padding: "9px 22px", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#111" : "#6b7280",
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {t.pending > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 6,
                background: "#ef4444", color: "#fff",
                fontSize: 9, fontWeight: 800,
                padding: "1px 5px", borderRadius: 20,
                minWidth: 16, textAlign: "center",
                lineHeight: "14px",
              }}>
                {t.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "মোট Record",       val: totalCount,      bg: "#eff6ff", color: "#1e40af" },
          { label: "Approved Amount",  val: fmt(approvedAmount), bg: "#d1fae5", color: "#065f46" },
          { label: "Pending Request",  val: pendingCount,    bg: "#fef3c7", color: "#92400e" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, marginTop: 3 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter + Refresh */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 নাম বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: "10px 14px",
            border: "1.5px solid #e5e7eb", borderRadius: 10,
            fontSize: 13, outline: "none",
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "10px 12px", border: "1.5px solid #e5e7eb",
            borderRadius: 10, fontSize: 13, outline: "none",
            background: "#fff", cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={load}
          style={{
            padding: "10px 14px", border: "1px solid #e5e7eb",
            borderRadius: 10, background: "#fff",
            cursor: "pointer", fontWeight: 600, fontSize: 13,
          }}
        >
          🔄
        </button>
      </div>

      {/* Record Count */}
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
        {filtered.length} টি রেকর্ড দেখাচ্ছে
        {filter === "pending" && filtered.length > 0 && (
          <span style={{ marginLeft: 8, color: "#ef4444", fontWeight: 700 }}>
            ⚠ {filtered.length} টি pending
          </span>
        )}
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          ⏳ লোড হচ্ছে...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 14, padding: 40,
          textAlign: "center", border: "1px solid #f3f4f6",
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, color: "#374151" }}>কোনো রেকর্ড নেই</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r) => (
            <div
              key={r._id}
              style={{
                background: "#fff", borderRadius: 12,
                border: r.status === "pending" ? "1.5px solid #fbbf24" : "1px solid #f3f4f6",
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 14,
                boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: tab === "deposit" ? "#d1fae5" : "#ede9fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>
                {tab === "deposit" ? "💰" : "🏧"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 2 }}>
                  {r.userName || r.name || r.user?.name || "Unknown"}
                  <span style={{ fontWeight: 400, fontSize: 12, color: "#6b7280", marginLeft: 6 }}>
                    {r.user?.phone || r.phone || ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {(r.method || "—").toUpperCase()} ·{" "}
                  {tab === "deposit"
                    ? `TrxID: ${r.trxId || "—"}`
                    : `A/C: ${r.accountNo || "—"}`}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {fmtDate(r.createdAt)}
                </div>
                {r.note && (
                  <div style={{
                    fontSize: 11, marginTop: 4, padding: "3px 8px",
                    background: r.status === "rejected" ? "#fff5f5" : "#f9fafb",
                    borderRadius: 6, color: r.status === "rejected" ? "#c62828" : "#6b7280",
                    display: "inline-block",
                  }}>
                    {r.note}
                  </div>
                )}
              </div>

              {/* Amount + Status + Action */}
              <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{
                  fontSize: 16, fontWeight: 900, marginBottom: 2,
                  color: tab === "deposit" ? "#065f46" : "#7c3aed",
                }}>
                  {fmt(r.amount)}
                </div>
                <Badge status={r.status || "pending"} />

                {/* ✅ Approve / Reject button শুধু pending এ দেখাবে */}
                {r.status === "pending" && (
                  <button
                    onClick={() => setModal({ item: r, type: tab })}
                    style={{
                      marginTop: 4,
                      padding: "6px 14px",
                      background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                      color: "#fff", border: "none",
                      borderRadius: 8, fontWeight: 700,
                      fontSize: 12, cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(59,130,246,0.4)",
                    }}
                  >
                    Review করুন →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Approve/Reject Modal ──────────────────────────────────────────── */}
      {modal && (
        <ActionModal
          item={modal.item}
          type={modal.type}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
};

export default TransactionHistory;