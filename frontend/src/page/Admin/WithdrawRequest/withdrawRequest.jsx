 // page/Admin/WithdrawRequest/withdrawRequest.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api, fmt, timeAgo } from "../../../utils/adminApi";

const Badge = ({ status }) => {
  const map = {
    pending:  { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const WithdrawRequests = ({ adminName, refresh }) => {
  const [list,        setList]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState(null);
  const [approveModal, setApproveModal] = useState(null); // r object
  const [rejectModal,  setRejectModal]  = useState(null);
  const [trxId,  setTrxId]  = useState("");
  const [note,   setNote]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/withdraw/admin/all?status=pending");
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    if (!approveModal) return;
    setActionId(approveModal._id);
    await api(`/withdraw/admin/approve/${approveModal._id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName, trxId }),
    });
    setActionId(null);
    setApproveModal(null);
    setTrxId("");
    load();
    refresh?.();
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal._id);
    await api(`/withdraw/admin/reject/${rejectModal._id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName, note }),
    });
    setActionId(null);
    setRejectModal(null);
    setNote("");
    load();
    refresh?.();
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>🏧 Withdraw Requests</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Pending উত্তোলন approve বা reject করুন</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {list.length > 0 && (
            <span style={{ background: "#ede9fe", color: "#7c3aed", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {list.length} pending
            </span>
          )}
          <button onClick={load} style={{ padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>লোড হচ্ছে...</div>
      ) : list.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", border: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, color: "#374151" }}>কোনো pending withdraw নেই</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((r) => (
            <div key={r._id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {/* Header */}
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.userName || r.name || "Unknown User"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.phone || ""} · {timeAgo(r.createdAt)}</div>
                </div>
                <Badge status={r.status || "pending"} />
              </div>

              {/* Body */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>AMOUNT</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#7c3aed" }}>{fmt(r.amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>METHOD</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{(r.method || "—").toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>ACCOUNT</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{r.accountNo || "—"}</div>
                  </div>
                </div>

                {r.note && (
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#6b7280" }}>
                    📝 {r.note}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => { setApproveModal(r); setTrxId(""); }}
                    style={{ padding: "12px 0", border: "none", borderRadius: 10, background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    ✅ Pay করুন
                  </button>
                  <button
                    onClick={() => { setRejectModal(r); setNote(""); }}
                    style={{ padding: "12px 0", border: "1.5px solid #ef4444", borderRadius: 10, background: "#fff", color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div onClick={() => setApproveModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#065f46" }}>✅ Withdraw Approve</h3>
            <div style={{ background: "#d1fae5", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#065f46" }}>
                <b>{approveModal.userName || "User"}</b> কে <b>{fmt(approveModal.amount)}</b> পাঠাবেন
              </div>
              <div style={{ fontSize: 12, color: "#047857", marginTop: 4 }}>
                {approveModal.method?.toUpperCase()} → {approveModal.accountNo}
              </div>
            </div>
            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Transaction ID (TrxID)</label>
            <input
              type="text"
              placeholder="Payment করার পর TrxID লিখুন"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setApproveModal(null)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600 }}>
                বাতিল
              </button>
              <button onClick={approve} disabled={!!actionId || !trxId.trim()} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: trxId.trim() ? "#22c55e" : "#86efac", color: "#fff", fontWeight: 700, cursor: trxId.trim() ? "pointer" : "not-allowed" }}>
                {actionId ? "..." : "✅ Confirm Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div onClick={() => setRejectModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>❌ Reject Withdraw</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>
              {rejectModal.userName || "User"} এর {fmt(rejectModal.amount)} withdraw reject করবেন?
            </p>
            <textarea
              rows={3}
              placeholder="কারণ লিখুন (optional) — user দেখতে পাবে"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, boxSizing: "border-box", resize: "none", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600 }}>
                বাতিল
              </button>
              <button onClick={reject} disabled={!!actionId} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {actionId ? "..." : "Reject করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawRequests;