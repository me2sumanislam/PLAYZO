 import React, { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
const api = async (path, opts = {}) => {
  try {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      ...opts,
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("bn-BD");
const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ color, children }) => {
  const map = {
    green: { bg: "#d1fae5", color: "#065f46" },
    red:   { bg: "#fee2e2", color: "#991b1b" },
    amber: { bg: "#fef3c7", color: "#92400e" },
    blue:  { bg: "#dbeafe", color: "#1e40af" },
    gray:  { bg: "#f3f4f6", color: "#374151" },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{ ...s, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
      {children}
    </span>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard",        label: "Dashboard",        icon: "⊞" },
  { key: "create-match",     label: "Create match",     icon: "＋" },
  { key: "deposit-requests", label: "Deposit requests", icon: "↓", badge: "deposit" },
  { key: "withdraw-requests",label: "Withdraw requests",icon: "↑", badge: "withdraw" },
  { key: "money-overview",   label: "Money overview",   icon: "₹" },
  { key: "deposit-history",  label: "Deposit history",  icon: "◷" },
  { key: "withdraw-history", label: "Withdraw history", icon: "◷" },
  { key: "users",            label: "Users",            icon: "👥" },
  { key: "match-results",    label: "Match results",    icon: "🏆" },
  { key: "activity-log",     label: "Activity log",     icon: "📋" },
  { key: "manage-admins",    label: "Manage admins",    icon: "🔐" },
];

const Sidebar = ({ page, setPage, admin, onLogout, badges }) => (
  <aside style={{
    width: 210, minWidth: 210, background: "#0f172a",
    display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0,
  }}>
    <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #1e293b" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", letterSpacing: 1 }}>🎮 FF ADMIN</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Free Fire Tournament</div>
    </div>

    <div style={{ margin: "12px 12px 8px", background: "#1e293b", borderRadius: 10, padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
        {(admin?.name || admin?.phone || "A").charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{admin?.name || admin?.phone || "Admin"}</div>
        <div style={{ fontSize: 10, color: "#64748b" }}>{admin?.role || "Admin"}</div>
      </div>
    </div>

    <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
      {NAV.map((n) => {
        const cnt = n.badge === "deposit" ? badges.deposit : n.badge === "withdraw" ? badges.withdraw : 0;
        return (
          <div key={n.key} onClick={() => setPage(n.key)} style={{
            display: "flex", alignItems: "center", gap: 9, padding: "8px 14px",
            fontSize: 12.5, cursor: "pointer",
            borderLeft: page === n.key ? "3px solid #3b82f6" : "3px solid transparent",
            background: page === n.key ? "#1e293b" : "transparent",
            color: page === n.key ? "#f1f5f9" : "#94a3b8",
            transition: "all 0.12s",
          }}>
            <span style={{ fontSize: 13 }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {cnt > 0 && <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 20 }}>{cnt}</span>}
          </div>
        );
      })}
    </nav>

    <div style={{ padding: 12, borderTop: "1px solid #1e293b" }}>
      <button onClick={onLogout} style={{ width: "100%", padding: "7px", background: "#1e293b", border: "none", borderRadius: 8, color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
        Sign out
      </button>
    </div>
  </aside>
);

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const Topbar = ({ title, sub }) => (
  <div style={{ padding: "14px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{sub}</div>}
    </div>
    <div style={{ fontSize: 11, color: "#9ca3af" }}>
      {new Date().toLocaleDateString("en-BD", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
    </div>
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || "#111827" }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── REQUEST ROW ──────────────────────────────────────────────────────────────
const ReqRow = ({ r, onApprove, onReject, actionLabel = "Approve" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#1e40af" }}>
      {(r.user?.name || r.user?.phone || r.userName || "U").charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{r.user?.name || r.user?.phone || r.userName || "Unknown"}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{r.method || "bKash"} · {timeAgo(r.createdAt)}</div>
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fmt(r.amount)}</div>
    <button onClick={() => onApprove(r._id)} style={{ fontSize: 11, padding: "4px 10px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>{actionLabel}</button>
    <button onClick={() => onReject(r._id)} style={{ fontSize: 11, padding: "4px 10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Reject</button>
  </div>
);

// ─── HISTORY ROW ──────────────────────────────────────────────────────────────
const HistRow = ({ h }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#374151" }}>
      {(h.user?.name || h.user?.phone || h.userName || "U").charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{h.user?.name || h.user?.phone || h.userName || "Unknown"}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{h.method || ""} · {timeAgo(h.updatedAt || h.createdAt)}</div>
      <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 1 }}>By {h.approvedBy || h.rejectedBy || "Admin"}</div>
    </div>
    <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(h.amount)}</div>
    <Badge color={h.status === "approved" ? "green" : "red"}>{h.status}</Badge>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// PAGES
// ════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdraws, setRecentWithdraws] = useState([]);

  useEffect(() => {
    api("/admin/stats").then(d => setStats(d?.data || d || {})).catch(() => {});
    api("/admin/deposits?status=approved&limit=3").then(d => {
      setRecentDeposits(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
    api("/admin/withdraws?status=pending&limit=3").then(d => {
      setRecentWithdraws(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);

  const balance = (stats?.totalDeposit || 0) - (stats?.totalWithdraw || 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total deposited"   value={fmt(stats?.totalDeposit)} color="#059669" sub="All time" />
        <StatCard label="Total withdrawn"   value={fmt(stats?.totalWithdraw)} color="#dc2626" sub="All time" />
        <StatCard label="Balance"           value={fmt(balance)} color={balance >= 0 ? "#059669" : "#dc2626"} sub="Deposit − Withdraw" />
        <StatCard label="Pending requests"  value={(stats?.pendingDeposit || 0) + (stats?.pendingWithdraw || 0)} color="#d97706" sub="Needs action" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent approved deposits</div>
          {recentDeposits.length === 0
            ? <p style={{ fontSize: 12, color: "#9ca3af" }}>No data</p>
            : recentDeposits.map(h => <HistRow key={h._id} h={h} />)}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pending withdraw requests</div>
          {recentWithdraws.length === 0
            ? <p style={{ fontSize: 12, color: "#9ca3af" }}>No pending</p>
            : recentWithdraws.map(r => (
              <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.user?.name || r.user?.phone || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{r.method || ""} · {timeAgo(r.createdAt)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmt(r.amount)}</div>
                <Badge color="amber">Pending</Badge>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// ─── CREATE MATCH ─────────────────────────────────────────────────────────────
const CreateMatch = () => {
  const [form, setForm] = useState({
    title: "", category: "solo", entryFee: "", winPrize: "",
    totalPlayers: "", startTime: "", perKill: "", map: "",
    device: "Mobile", image: "",
  });
  const [msg, setMsg] = useState("");
const handleImage = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // ✅ Image compress করে base64 বানাবে
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    // Max 400px width
    const maxWidth = 400;
    const scale = Math.min(1, maxWidth / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Quality 0.6 — ছোট size
    const compressed = canvas.toDataURL("image/jpeg", 0.6);
    setForm(p => ({ ...p, image: compressed }));
  };

  img.src = URL.createObjectURL(file);
};

  const submit = async () => {
    if (!form.title || !form.startTime) {
      setMsg("❌ Title আর Start Time অবশ্যই দিন");
      return;
    }
    const d = await api("/matches/create", { method: "POST", body: JSON.stringify(form) });
    setMsg(d.success ? "✅ Match created!" : "❌ " + (d.message || "Failed"));
    if (d.success) setForm({
      title: "", category: "solo", entryFee: "", winPrize: "",
      totalPlayers: "", startTime: "", perKill: "", map: "",
      device: "Mobile", image: "",
    });
  };

  const inp = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const f = (k) => ({ style: inp, value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🎮 New Match Create</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Title */}
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Match Title *</div>
            <input placeholder="যেমন: Solo Time" {...f("title")} />
          </div>

          {/* Category */}
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Category</div>
            <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="solo">SOLO</option>
              <option value="duo">DUO</option>
              <option value="squad">SQUAD</option>
              <option value="cs">CS</option>
              <option value="custom">CUSTOM</option>
              <option value="tournament">TOURNAMENT</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Start Time * (এই সময়ের 20 মিনিট পরে match auto delete হবে)</div>
            <input type="datetime-local" {...f("startTime")} />
          </div>

          {/* Entry Fee + Win Prize */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Entry Fee (৳)</div>
              <input placeholder="যেমন: 10" {...f("entryFee")} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Win Prize (৳)</div>
              <input placeholder="যেমন: 405" {...f("winPrize")} />
            </div>
          </div>

          {/* Total Players + Per Kill */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Total Players</div>
              <input placeholder="যেমন: 48" {...f("totalPlayers")} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Per Kill (৳)</div>
              <input placeholder="যেমন: 5" {...f("perKill")} />
            </div>
          </div>

          {/* Map + Device */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Map</div>
              <input placeholder="Bermuda / Kalahari..." {...f("map")} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Device</div>
              <select style={inp} value={form.device} onChange={e => setForm(p => ({ ...p, device: e.target.value }))}>
                <option value="Mobile">Mobile</option>
                <option value="Emulator">Emulator</option>
                <option value="All">All Device</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Match Banner Image</div>
            <label style={{
              display: "block", padding: "12px", border: "1.5px dashed #d1d5db",
              borderRadius: 8, textAlign: "center", cursor: "pointer",
              fontSize: 13, color: "#6b7280", background: "#f9fafb",
            }}>
              📷 Image Upload করুন
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </label>
            {form.image && (
              <div style={{ marginTop: 8, position: "relative" }}>
                <img src={form.image} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} />
                <button
                  onClick={() => setForm(p => ({ ...p, image: "" }))}
                  style={{ position: "absolute", top: 6, right: 6, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {/* Message */}
          {msg && (
            <div style={{
              fontSize: 12, padding: "8px 10px", borderRadius: 6,
              background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
              color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
            }}>{msg}</div>
          )}

          {/* Submit */}
          <button onClick={submit} style={{
            padding: "12px", background: "#111827", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            🎮 Create Match
          </button>

        </div>
      </div>
    </div>
  );
};

// ─── DEPOSIT REQUESTS ─────────────────────────────────────────────────────────
const DepositRequests = ({ adminName, refresh }) => {
  const [list, setList] = useState([]);
  const load = useCallback(() => {
    api("/admin/deposits?status=pending").then(d => {
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    await api(`/admin/deposits/${id}/approve`, { method: "PUT", body: JSON.stringify({ adminName }) });
    load(); refresh();
  };
  const reject = async (id) => {
    await api(`/admin/deposits/${id}/reject`, { method: "PUT", body: JSON.stringify({ adminName }) });
    load(); refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Deposit requests</div>
          <Badge color="amber">{list.length} pending</Badge>
        </div>
        {list.length === 0
          ? <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 24 }}>No pending deposit requests</p>
          : list.map(r => <ReqRow key={r._id} r={r} onApprove={approve} onReject={reject} />)}
      </div>
    </div>
  );
};

// ─── WITHDRAW REQUESTS ────────────────────────────────────────────────────────
const WithdrawRequests = ({ adminName, refresh }) => {
  const [list, setList] = useState([]);
  const load = useCallback(() => {
    api("/admin/withdraws?status=pending").then(d => {
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    await api(`/admin/withdraws/${id}/approve`, { method: "PUT", body: JSON.stringify({ adminName }) });
    load(); refresh();
  };
  const reject = async (id) => {
    await api(`/admin/withdraws/${id}/reject`, { method: "PUT", body: JSON.stringify({ adminName }) });
    load(); refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Withdraw requests</div>
          <Badge color="red">{list.length} pending</Badge>
        </div>
        {list.length === 0
          ? <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 24 }}>No pending withdraw requests</p>
          : list.map(r => <ReqRow key={r._id} r={r} onApprove={approve} onReject={reject} actionLabel="Pay ✓" />)}
      </div>
    </div>
  );
};

// ─── MONEY OVERVIEW ───────────────────────────────────────────────────────────
const MoneyOverview = () => {
  const [stats, setStats] = useState({});
  useEffect(() => {
    api("/admin/stats").then(d => setStats(d?.data || d || {})).catch(() => {});
  }, []);

  const rows = [
    { label: "Total user deposits (approved)",    value: stats?.totalDeposit,        color: "#059669" },
    { label: "Total user withdrawals (approved)", value: stats?.totalWithdraw,       color: "#dc2626" },
    { label: "Net balance",                       value: (stats?.totalDeposit || 0) - (stats?.totalWithdraw || 0), color: "#2563eb" },
    { label: "Pending deposit amount",            value: stats?.pendingDepositAmount, color: "#d97706" },
    { label: "Pending withdraw amount",           value: stats?.pendingWithdrawAmount,color: "#d97706" },
    { label: "Total users",   value: stats?.totalUsers,   color: "#111827", isMoney: false },
    { label: "Total matches", value: stats?.totalMatches, color: "#111827", isMoney: false },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Money overview</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < rows.length - 1 ? "1px solid #f3f4f6" : "none" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>
              {r.isMoney === false ? (r.value ?? "—") : fmt(r.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── HISTORY ──────────────────────────────────────────────────────────────────
const History = ({ type }) => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api(`/admin/${type}s?status=all&limit=50`).then(d => {
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, [type]);

  const filtered = list.filter(h =>
    (h.user?.name || h.user?.phone || h.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{type === "deposit" ? "Deposit" : "Withdraw"} history</div>
          <input placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none" }} />
        </div>
        {filtered.length === 0
          ? <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 24 }}>No records</p>
          : filtered.map(h => <HistRow key={h._id} h={h} />)}
      </div>
    </div>
  );
};

// ─── USERS ────────────────────────────────────────────────────────────────────
const Users = () => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/admin/users").then(d => {
      setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);

  const toggleBan = async (id, banned) => {
    await api(`/admin/users/${id}/${banned ? "unban" : "ban"}`, { method: "PUT" });
    setList(l => l.map(u => u._id === id ? { ...u, isBlocked: !banned } : u));
  };

  const filtered = list.filter(u =>
    (u.name || u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Users ({list.length})</div>
          <input placeholder="Search name / phone..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", width: 180 }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Name/Phone","Balance","Deposit","Withdraw","Status","Action"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>{u.name || u.phone}</td>
                <td style={{ padding: "9px 10px", color: "#059669", fontWeight: 600 }}>{fmt(u.balance)}</td>
                <td style={{ padding: "9px 10px" }}>{fmt(u.totalDeposit)}</td>
                <td style={{ padding: "9px 10px" }}>{fmt(u.totalWithdraw)}</td>
                <td style={{ padding: "9px 10px" }}><Badge color={u.isBlocked ? "red" : "green"}>{u.isBlocked ? "Banned" : "Active"}</Badge></td>
                <td style={{ padding: "9px 10px" }}>
                  <button onClick={() => toggleBan(u._id, u.isBlocked)}
                    style={{ fontSize: 11, padding: "3px 8px", background: u.isBlocked ? "#d1fae5" : "#fee2e2", color: u.isBlocked ? "#065f46" : "#991b1b", border: "none", borderRadius: 6, cursor: "pointer" }}>
                    {u.isBlocked ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MATCH RESULTS ────────────────────────────────────────────────────────────
const MatchResults = () => {
  const [matches, setMatches] = useState([]);
  const [winner, setWinner] = useState({});
  const [roomData, setRoomData] = useState({});

  useEffect(() => {
    api("/matches").then(d => {
      setMatches(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.matches) ? d.matches : []);
    }).catch(() => {});
  }, []);

  const submitResult = async (matchId) => {
    const w = winner[matchId];
    if (!w) return alert("Winner phone / name দিন");
    const d = await api(`/admin/matches/${matchId}/result`, { method: "PUT", body: JSON.stringify({ winner: w }) });
    alert(d.message || "Result saved!");
  };

  const updateRoom = async (id) => {
    const d = await api(`/matches/update-room/${id}`, { method: "PUT", body: JSON.stringify(roomData[id] || {}) });
    if (d.success) alert("Room updated! ✅");
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      {matches.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 40 }}>No matches found</p>}
      {matches.map(m => (
        <div key={m._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{m.category} · {m.joinedPlayers || 0}/{m.totalPlayers} players · Prize: {fmt(m.winPrize)}</div>
            </div>
            <Badge color={m.status === "live" ? "green" : m.status === "completed" ? "gray" : "blue"}>{m.status || "upcoming"}</Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input placeholder="Room ID"
              onChange={e => setRoomData(p => ({ ...p, [m._id]: { ...p[m._id], roomId: e.target.value } }))}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none" }} />
            <input placeholder="Room Password"
              onChange={e => setRoomData(p => ({ ...p, [m._id]: { ...p[m._id], roomPassword: e.target.value } }))}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none" }} />
          </div>
          <button onClick={() => updateRoom(m._id)}
            style={{ width: "100%", padding: "7px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
            Update Room ✅
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Winner phone / name"
              value={winner[m._id] || ""}
              onChange={e => setWinner(p => ({ ...p, [m._id]: e.target.value }))}
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none" }} />
            <button onClick={() => submitResult(m._id)}
              style={{ padding: "8px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Save result
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api("/admin/logs").then(d => {
      setLogs(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);

  const colorMap = { approve: "green", reject: "red", create: "blue", ban: "amber", login: "gray" };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Admin activity log</div>
        {logs.length === 0
          ? <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 24 }}>No logs yet</p>
          : logs.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {(l.adminName || "A").charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{l.adminName} </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{l.action} </span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{l.target}</span>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{timeAgo(l.createdAt)}</div>
              </div>
              <Badge color={colorMap[l.type] || "gray"}>{l.type}</Badge>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── MANAGE ADMINS ────────────────────────────────────────────────────────────
const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", password: "", role: "admin" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/admin/admins").then(d => {
      setAdmins(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    }).catch(() => {});
  }, []);

  const create = async () => {
    const d = await api("/admin/admins/create", { method: "POST", body: JSON.stringify(form) });
    setMsg(d.success ? "✅ Admin created!" : "❌ " + (d.message || "Failed"));
    if (d.success) {
      setForm({ name: "", phone: "", password: "", role: "admin" });
      if (d.admin) setAdmins(p => [...p, d.admin]);
    }
  };

  const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add new admin</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Name" style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input placeholder="Phone" style={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <input placeholder="Password" type="password" style={inp} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <select style={inp} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
            <option value="finance">Finance only</option>
          </select>
          {msg && <div style={{ fontSize: 12, padding: "6px 10px", background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2", color: msg.startsWith("✅") ? "#065f46" : "#991b1b", borderRadius: 6 }}>{msg}</div>}
          <button onClick={create} style={{ padding: 10, background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create admin</button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>All admins</div>
        {admins.length === 0
          ? <p style={{ fontSize: 13, color: "#9ca3af" }}>No admins yet</p>
          : admins.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1e40af" }}>
                {(a.name || a.phone || "A").charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name || a.phone}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{a.phone}</div>
              </div>
              <Badge color={a.role === "super-admin" ? "blue" : "gray"}>{a.role}</Badge>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success || d.token) {
        localStorage.setItem("adminToken", d.token);
        onLogin(d.admin || d.user || { name: "Admin", role: "admin" });
      } else {
        setErr(d.message || "Login failed");
      }
    } catch {
      setErr("Server error");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ width: 340, background: "#1e293b", borderRadius: 16, padding: 28, border: "1px solid #334155" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎮</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Admin Login</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Free Fire Tournament</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Phone number" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            style={{ padding: "11px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, outline: "none" }} />
          <input placeholder="Password" type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ padding: "11px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, outline: "none" }} />
          {err && <div style={{ fontSize: 12, color: "#f87171", background: "#450a0a", padding: "6px 10px", borderRadius: 6 }}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ padding: "11px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
const AdminPanel = () => {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [badges, setBadges] = useState({ deposit: 0, withdraw: 0 });

  const loadBadges = useCallback(() => {
    api("/admin/deposits?status=pending").then(d => {
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      setBadges(p => ({ ...p, deposit: arr.length }));
    }).catch(() => {});
    api("/admin/withdraws?status=pending").then(d => {
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      setBadges(p => ({ ...p, withdraw: arr.length }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const saved = localStorage.getItem("adminInfo");
    if (token && saved) {
      try { setAdmin(JSON.parse(saved)); loadBadges(); }
      catch { localStorage.removeItem("adminInfo"); }
    }
  }, [loadBadges]);

  const handleLogin = (a) => {
    localStorage.setItem("adminInfo", JSON.stringify(a));
    setAdmin(a);
    loadBadges();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
  };

  if (!admin) return <Login onLogin={handleLogin} />;

  const titles = {
    "dashboard":         ["Dashboard",         "Overview of all activity"],
    "create-match":      ["Create match",       "Add a new tournament match"],
    "deposit-requests":  ["Deposit requests",   "Approve or reject incoming deposits"],
    "withdraw-requests": ["Withdraw requests",  "Process user withdrawal requests"],
    "money-overview":    ["Money overview",     "Full financial summary"],
    "deposit-history":   ["Deposit history",    "All deposit transactions"],
    "withdraw-history":  ["Withdraw history",   "All withdrawal transactions"],
    "users":             ["Users",              "Manage all users"],
    "match-results":     ["Match results",      "Enter winner and distribute prize"],
    "activity-log":      ["Activity log",       "All admin actions"],
    "manage-admins":     ["Manage admins",      "Add or manage admin accounts"],
  };

  const [title, sub] = titles[page] || ["Admin", ""];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar page={page} setPage={setPage} admin={admin} onLogout={handleLogout} badges={badges} />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <Topbar title={title} sub={sub} />
        {page === "dashboard"         && <Dashboard />}
        {page === "create-match"      && <CreateMatch />}
        {page === "deposit-requests"  && <DepositRequests adminName={admin.name || admin.phone} refresh={loadBadges} />}
        {page === "withdraw-requests" && <WithdrawRequests adminName={admin.name || admin.phone} refresh={loadBadges} />}
        {page === "money-overview"    && <MoneyOverview />}
        {page === "deposit-history"   && <History type="deposit" />}
        {page === "withdraw-history"  && <History type="withdraw" />}
        {page === "users"             && <Users />}
        {page === "match-results"     && <MatchResults />}
        {page === "activity-log"      && <ActivityLog />}
        {page === "manage-admins"     && <ManageAdmins />}
      </main>
    </div>
  );
};

export default AdminPanel;
