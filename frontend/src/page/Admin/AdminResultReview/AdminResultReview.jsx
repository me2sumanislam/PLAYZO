 import React, { useState, useEffect, useCallback } from "react";

const API = "https://playzo-vn8e.onrender.com";

const AdminResultReview = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [filter, setFilter]           = useState("pending_review");
  const [selected, setSelected]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState("");

  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/result/admin/submissions?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.data || []);
    } catch { setSubmissions([]); }
    setLoading(false);
  }, [filter, token]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const updatePlayer = (idx, field, value) => {
    const updated = [...selected.finalPlayers];
    updated[idx] = { ...updated[idx], [field]: field === "kills" ? parseInt(value) || 0 : value };
    setSelected({ ...selected, finalPlayers: updated });
  };

  const removePlayer = (idx) => {
    const updated = selected.finalPlayers.filter((_, i) => i !== idx);
    setSelected({ ...selected, finalPlayers: updated });
  };

  const addPlayer = () => {
    const updated = [...(selected.finalPlayers || []), { inGameName: "", kills: 0, rank: 0, isMatched: false, matchedUserId: null }];
    setSelected({ ...selected, finalPlayers: updated });
  };

  const handleReview = async (action) => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/result/admin/review/${selected._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action, finalPlayers: selected.finalPlayers, adminNote: selected.adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(action === "approve" ? "✅ Approved!" : "❌ Rejected");
        setSelected(null);
        load();
      } else {
        showToast(data.message || "Error");
      }
    } catch { showToast("Network error"); }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!window.confirm("Result publish করবেন? Prize distribute হয়ে যাবে।")) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/result/admin/publish/${selected._id}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast("🏆 Result published! Prize distributed.");
        setSelected(null);
        load();
      } else {
        showToast(data.message || "Error");
      }
    } catch { showToast("Network error"); }
    setSaving(false);
  };

  if (selected) {
    return (
      <div style={styles.wrap}>
        {toast && <div style={styles.toast}>{toast}</div>}

        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setSelected(null)}>← Back</button>
          <h2 style={styles.title}>{selected.match?.title}</h2>
          <span style={styles.badge(selected.status)}>{selected.status}</span>
        </div>

        <div style={styles.twoCol}>
          <div style={styles.imgBox}>
            <div style={styles.sectionLabel}>Screenshot</div>
            <img
              src={selected.screenshot?.url}
              alt="result screenshot"
              style={{ width: "100%", borderRadius: 8, cursor: "zoom-in" }}
              onClick={() => window.open(selected.screenshot?.url, "_blank")}
            />
            <p style={styles.hint}>Click করলে full-size দেখবেন</p>
          </div>

          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>
              OCR Result
              <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}>
                (edit করতে পারবেন)
              </span>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Game Name</th>
                  <th style={styles.th}>Kills</th>
                  <th style={styles.th}>Matched</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {(selected.finalPlayers || []).map((p, i) => (
                  <tr key={i} style={{ background: p.isMatched ? "#f0fdf4" : "#fff" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>
                      <input
                        style={styles.input}
                        value={p.inGameName}
                        onChange={(e) => updatePlayer(i, "inGameName", e.target.value)}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        style={{ ...styles.input, width: 60 }}
                        type="number"
                        min={0}
                        value={p.kills}
                        onChange={(e) => updatePlayer(i, "kills", e.target.value)}
                      />
                    </td>
                    <td style={styles.td}>
                      {p.isMatched
                        ? <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>
                        : <span style={{ color: "#dc2626" }}>✗</span>
                      }
                    </td>
                    <td style={styles.td}>
                      <button style={styles.delBtn} onClick={() => removePlayer(i)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button style={styles.addBtn} onClick={addPlayer}>+ Player যোগ করুন</button>

            <div style={{ marginTop: 12 }}>
              <div style={styles.sectionLabel}>Admin Note</div>
              <textarea
                style={styles.textarea}
                rows={2}
                placeholder="Optional — reject এর কারণ ইত্যাদি"
                value={selected.adminNote || ""}
                onChange={(e) => setSelected({ ...selected, adminNote: e.target.value })}
              />
            </div>

            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>
                OCR Raw Text দেখুন
              </summary>
              <pre style={{ fontSize: 11, background: "#f9fafb", padding: 8, borderRadius: 6, marginTop: 6, overflowX: "auto" }}>
                {selected.ocrRawText || "—"}
              </pre>
            </details>

            <div style={styles.actions}>
              {selected.status === "pending_review" && (
                <>
                  <button style={styles.rejectBtn} disabled={saving} onClick={() => handleReview("reject")}>
                    Reject
                  </button>
                  <button style={styles.approveBtn} disabled={saving} onClick={() => handleReview("approve")}>
                    {saving ? "..." : "Approve করুন"}
                  </button>
                </>
              )}
              {selected.status === "approved" && (
                <button style={styles.publishBtn} disabled={saving} onClick={handlePublish}>
                  {saving ? "..." : "Publish + Prize Distribute"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.header}>
        <h2 style={styles.title}>Result Submissions</h2>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? "⏳" : "🔄 Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["pending_review", "approved", "rejected", "published", "processing"].map((s) => (
          <button
            key={s}
            style={{ ...styles.tab, ...(filter === s ? styles.tabActive : {}) }}
            onClick={() => setFilter(s)}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}

      {!loading && submissions.length === 0 && (
        <p style={{ color: "#9ca3af", padding: 20, textAlign: "center" }}>
          কোনো submission নেই
        </p>
      )}

      {submissions.map((sub) => (
        <div key={sub._id} style={styles.card} onClick={() => setSelected(sub)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={styles.cardTitle}>{sub.match?.title || "—"}</div>
              <div style={styles.cardSub}>
                Submitted by: {sub.submittedBy?.name || sub.submittedBy?.phone || "—"}
                &nbsp;·&nbsp;
                {new Date(sub.createdAt).toLocaleString("bn-BD")}
              </div>
              <div style={styles.cardSub}>
                {sub.finalPlayers?.length || 0} players detected by OCR
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {sub.screenshot?.url && (
                <img
                  src={sub.screenshot.url}
                  alt=""
                  style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6 }}
                />
              )}
              <span style={styles.badge(sub.status)}>{sub.status.replace("_", " ")}</span>
              <span style={{ fontSize: 18, color: "#9ca3af" }}>›</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  wrap:       { padding: "16px", maxWidth: 960, margin: "0 auto" },
  header:     { display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  title:      { fontSize: 20, fontWeight: 700, margin: 0, flex: 1 },
  backBtn:    { background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 },
  refreshBtn: { background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 },
  badge: (s) => ({
    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: { pending_review: "#dbeafe", approved: "#d1fae5", rejected: "#fee2e2", published: "#ede9fe", processing: "#fef3c7" }[s] || "#f3f4f6",
    color:      { pending_review: "#1e40af", approved: "#065f46", rejected: "#991b1b", published: "#5b21b6", processing: "#92400e" }[s] || "#374151",
  }),
  tab:       { padding: "6px 12px", borderRadius: 20, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer", textTransform: "capitalize" },
  tabActive: { background: "#7c3aed", color: "#fff", border: "1px solid #7c3aed" },
  card:      { background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: 14, marginBottom: 10, cursor: "pointer" },
  cardTitle: { fontWeight: 700, fontSize: 15 },
  cardSub:   { fontSize: 12, color: "#9ca3af", marginTop: 3 },
  twoCol:    { display: "flex", gap: 20, flexWrap: "wrap" },
  imgBox:    { width: 280, flexShrink: 0 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 },
  hint:    { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  table:   { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:      { textAlign: "left", padding: "6px 8px", background: "#f9fafb", fontWeight: 600, fontSize: 12, color: "#6b7280" },
  td:      { padding: "6px 8px", borderBottom: "1px solid #f3f4f6" },
  input:   { border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", fontSize: 13, width: "100%", background: "#fff" },
  addBtn:  { marginTop: 8, fontSize: 12, color: "#7c3aed", background: "none", border: "1px dashed #c4b5fd", borderRadius: 6, padding: "5px 12px", cursor: "pointer" },
  textarea: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 13, resize: "vertical", boxSizing: "border-box" },
  actions:    { display: "flex", gap: 10, marginTop: 16 },
  rejectBtn:  { flex: 1, padding: "10px 0", borderRadius: 8, background: "#fee2e2", color: "#991b1b", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  approveBtn: { flex: 2, padding: "10px 0", borderRadius: 8, background: "#059669", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  publishBtn: { flex: 1, padding: "10px 0", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  delBtn: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, padding: "0 4px" },
  toast:  { position: "sticky", top: 10, background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 },
};

export default AdminResultReview;