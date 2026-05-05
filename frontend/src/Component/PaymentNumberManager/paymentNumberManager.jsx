 import React, { useState, useEffect, useCallback } from "react";

const PaymentNumbers = ({ api }) => {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [form, setForm]         = useState({
    method: "bkash", number: "", limit: "", active: true,
  });

  // ─── Method config ────────────────────────────────────────────
  const METHOD = {
    bkash:  { emoji: "🩷", color: "#be185d", bg: "#fce7f3", label: "bKash"  },
    nagad:  { emoji: "🧡", color: "#ea580c", bg: "#ffedd5", label: "Nagad"  },
    rocket: { emoji: "💜", color: "#7c3aed", bg: "#ede9fe", label: "Rocket" },
  };
  const getM = (m) => METHOD[m?.toLowerCase()] || { emoji: "💳", color: "#6b7280", bg: "#f3f4f6", label: m };

  // ─── Fetch ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/admin/payment-numbers");
      setList(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch {
      setError("ডেটা লোড হয়নি।");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // ─── Save ─────────────────────────────────────────────────────
  const save = async () => {
    if (!form.number.trim()) { setMsg("❌ নম্বর দিন"); return; }
    setSaving(true);
    try {
      const res = await api("/admin/payment-numbers", "POST", {
        ...form,
        limit: form.limit ? Number(form.limit) : undefined,
      });
      if (res?.success) {
        setMsg("✅ সংরক্ষিত!");
        setForm({ method: "bkash", number: "", limit: "", active: true });
        setShowForm(false);
        load();
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg("❌ " + (res?.message || "Failed"));
      }
    } catch { setMsg("❌ সমস্যা হয়েছে"); }
    setSaving(false);
  };

  // ─── Toggle ───────────────────────────────────────────────────
  const toggle = async (id, active) => {
    await api(`/admin/payment-numbers/${id}`, "PUT", { active: !active });
    load();
  };

  // ─── Delete ───────────────────────────────────────────────────
  const remove = async (id) => {
    if (!window.confirm("এই নম্বরটি মুছে ফেলবেন?")) return;
    await api(`/admin/payment-numbers/${id}`, "DELETE");
    load();
  };

  // ─── Edit ─────────────────────────────────────────────────────
  const startEdit = (n) => {
    setEditId(n._id);
    setEditForm({ method: n.method, number: n.number, limit: n.limit || "", active: n.active });
  };

  const saveEdit = async () => {
    await api(`/admin/payment-numbers/${editId}`, "PUT", {
      ...editForm,
      limit: editForm.limit ? Number(editForm.limit) : undefined,
    });
    setEditId(null);
    load();
  };

  const inp = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box",
    background: "#f9fafb",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "14px 16px",
        boxShadow: "0 1px 4px #0001",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>📱 Payment Numbers</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>মোট: {list.length}টি নম্বর</div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setMsg(""); }}
          style={{
            padding: "8px 16px", background: showForm ? "#e0e7ff" : "#4f46e5",
            color: showForm ? "#4f46e5" : "#fff", border: "none",
            borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}
        >
          {showForm ? "✕ বাতিল" : "+ নতুন"}
        </button>
      </div>

      {/* ── Add Form ── */}
      {showForm && (
        <div style={{
          background: "#fff", borderRadius: 16, padding: 16,
          boxShadow: "0 1px 4px #0001", border: "2px solid #e0e7ff",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", marginBottom: 12 }}>
            ➕ নতুন নম্বর যোগ করুন
          </div>

          {/* Method buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {["bkash", "nagad", "rocket"].map((m) => {
              const cfg = getM(m);
              const active = form.method === m;
              return (
                <button key={m} onClick={() => setForm((p) => ({ ...p, method: m }))} style={{
                  padding: "10px 4px", borderRadius: 10,
                  border: `2px solid ${active ? cfg.color : "#e5e7eb"}`,
                  background: active ? cfg.bg : "#f9fafb",
                  color: active ? cfg.color : "#9ca3af",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={inp} placeholder="নম্বর: 01XXXXXXXXX" value={form.number}
              onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} />
            <input style={inp} placeholder="লিমিট (ঐচ্ছিক): যেমন 10000" value={form.limit}
              onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))} />

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
              <span style={{ fontWeight: 600, color: "#374151" }}>Active রাখুন</span>
            </label>

            {msg && (
              <div style={{
                fontSize: 12, padding: "8px 12px", borderRadius: 8, fontWeight: 600,
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
              }}>{msg}</div>
            )}

            <button onClick={save} disabled={saving} style={{
              padding: "11px", background: "#4f46e5", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "⏳ সেভ হচ্ছে..." : "💾 Save করুন"}
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: "#fee2e2", color: "#dc2626", padding: "12px 14px",
          borderRadius: 12, fontSize: 13, textAlign: "center",
        }}>
          ⚠️ {error}
          <button onClick={load} style={{
            marginLeft: 10, fontSize: 11, background: "#fca5a5",
            border: "none", borderRadius: 6, padding: "2px 8px", cursor: "pointer",
          }}>আবার চেষ্টা</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>
          ⏳ লোড হচ্ছে...
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && list.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", background: "#fff", borderRadius: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>কোনো নম্বর যোগ করা হয়নি</p>
        </div>
      )}

      {/* ── List ── */}
      {list.map((n) => {
        const cfg = getM(n.method);
        return (
          <div key={n._id} style={{
            background: "#fff", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 1px 4px #0001",
            border: `1px solid ${n.active ? "#bbf7d0" : "#e5e7eb"}`,
            opacity: n.active ? 1 : 0.7,
          }}>
            {editId === n._id ? (
              // ── Edit Mode ──
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select value={editForm.method}
                    onChange={(e) => setEditForm((p) => ({ ...p, method: e.target.value }))}
                    style={{ ...inp, padding: "8px 10px" }}>
                    <option value="bkash">🩷 bKash</option>
                    <option value="nagad">🧡 Nagad</option>
                    <option value="rocket">💜 Rocket</option>
                  </select>
                  <input style={{ ...inp, padding: "8px 10px" }} placeholder="নম্বর"
                    value={editForm.number}
                    onChange={(e) => setEditForm((p) => ({ ...p, number: e.target.value }))} />
                </div>
                <input style={{ ...inp, padding: "8px 10px" }} placeholder="লিমিট (ঐচ্ছিক)"
                  value={editForm.limit}
                  onChange={(e) => setEditForm((p) => ({ ...p, limit: e.target.value }))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{
                    flex: 1, padding: "9px", background: "#059669", color: "#fff",
                    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>✅ Update</button>
                  <button onClick={() => setEditId(null)} style={{
                    flex: 1, padding: "9px", background: "#f3f4f6", color: "#374151",
                    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>বাতিল</button>
                </div>
              </div>
            ) : (
              // ── View Mode ──
              <div>
                {/* Color top bar */}
                <div style={{ height: 4, background: cfg.color, borderRadius: "16px 16px 0 0" }} />

                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    background: cfg.bg, border: `2px solid ${cfg.color}40`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 1,
                  }}>
                    <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        background: cfg.bg, color: cfg.color,
                        fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                      }}>{cfg.emoji} {cfg.label}</span>
                      <span style={{
                        background: n.active ? "#d1fae5" : "#fee2e2",
                        color: n.active ? "#065f46" : "#991b1b",
                        fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                      }}>{n.active ? "✅ Active" : "❌ Off"}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: 0.5 }}>
                      {n.number}
                    </div>
                    {n.limit && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        📊 লিমিট: ৳{Number(n.limit).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{
                  display: "flex", borderTop: "1px solid #f3f4f6",
                }}>
                  {[
                    { label: n.active ? "বন্ধ করুন" : "চালু করুন", bg: n.active ? "#fef3c7" : "#d1fae5", color: n.active ? "#92400e" : "#065f46", onClick: () => toggle(n._id, n.active) },
                    { label: "✏️ Edit", bg: "#dbeafe", color: "#1e40af", onClick: () => startEdit(n) },
                    { label: "🗑️ Delete", bg: "#fee2e2", color: "#991b1b", onClick: () => remove(n._id) },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.onClick} style={{
                      flex: 1, padding: "10px 4px",
                      background: btn.bg, color: btn.color,
                      border: "none", borderRight: i < 2 ? "1px solid #f3f4f6" : "none",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}>{btn.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentNumbers;