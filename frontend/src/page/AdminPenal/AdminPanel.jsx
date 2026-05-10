import React, { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
const api = async (path, opts = {}) => {
  try {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    const res = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    red: { bg: "#fee2e2", color: "#991b1b" },
    amber: { bg: "#fef3c7", color: "#92400e" },
    blue: { bg: "#dbeafe", color: "#1e40af" },
    gray: { bg: "#f3f4f6", color: "#374151" },
  };
  const s = map[color] || map.gray;
  return (
    <span
      style={{
        ...s,
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 20,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
};
// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "⊞",
    roles: ["super-admin", "admin", "finance"],
  },
  {
    key: "create-match",
    label: "Create match",
    icon: "＋",
    roles: ["super-admin", "admin"],
  },
  {
    key: "deposit-requests",
    label: "Deposit requests",
    icon: "↓",
    badge: "deposit",
    roles: ["super-admin", "finance"],
  },
  {
    key: "withdraw-requests",
    label: "Withdraw requests",
    icon: "↑",
    badge: "withdraw",
    roles: ["super-admin", "finance"],
  },
  {
    key: "money-overview",
    label: "Money overview",
    icon: "₹",
    roles: ["super-admin", "finance"],
  },
  {
    key: "deposit-history",
    label: "Deposit history",
    icon: "◷",
    roles: ["super-admin", "finance"],
  },
  {
    key: "withdraw-history",
    label: "Withdraw history",
    icon: "◷",
    roles: ["super-admin", "finance"],
  },
  { key: "users", label: "Users", icon: "👥", roles: ["super-admin", "admin"] },
  {
    key: "match-results",
    label: "Match results",
    icon: "🏆",
    roles: ["super-admin", "admin"],
  },
  {
    key: "payment-numbers",
    label: "Payment Numbers",
    icon: "💳",
    roles: ["super-admin", "finance"],
  },
  {
    key: "activity-log",
    label: "Activity log",
    icon: "📋",
    roles: ["super-admin", "admin"],
  },
  {
    key: "manage-admins",
    label: "Manage admins",
    icon: "🔐",
    roles: ["super-admin"],
  },
];

const Sidebar = ({ page, setPage, admin, onLogout, badges }) => (
  <aside
    style={{
      width: 210,
      minWidth: 210,
      background: "#0f172a",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
    }}
  >
    <div
      style={{ padding: "20px 16px 14px", borderBottom: "1px solid #1e293b" }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#f8fafc",
          letterSpacing: 1,
        }}
      >
        🎮 FF ADMIN
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
        Free Fire Tournament
      </div>
    </div>
    <div
      style={{
        margin: "12px 12px 8px",
        background: "#1e293b",
        borderRadius: 10,
        padding: "8px 10px",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#3b82f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {(admin?.name || admin?.phone || "A").charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>
          {admin?.name || admin?.phone || "Admin"}
        </div>
        <div style={{ fontSize: 10, color: "#64748b" }}>
          {admin?.role || "Admin"}
        </div>
      </div>
    </div>

    <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
      {NAV.filter((n) => n.roles.includes(admin?.role)).map((n) => {
        const cnt =
          n.badge === "deposit"
            ? badges.deposit
            : n.badge === "withdraw"
              ? badges.withdraw
              : 0;
        return (
          <div
            key={n.key}
            onClick={() => setPage(n.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 14px",
              fontSize: 12.5,
              cursor: "pointer",
              borderLeft:
                page === n.key ? "3px solid #3b82f6" : "3px solid transparent",
              background: page === n.key ? "#1e293b" : "transparent",
              color: page === n.key ? "#f1f5f9" : "#94a3b8",
              transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 13 }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {cnt > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 20,
                }}
              >
                {cnt}
              </span>
            )}
          </div>
        );
      })}
    </nav>
    <div style={{ padding: 12, borderTop: "1px solid #1e293b" }}>
      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "7px",
          background: "#1e293b",
          border: "none",
          borderRadius: 8,
          color: "#94a3b8",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  </aside>
);

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const Topbar = ({ title, sub, onRefresh }) => (
  <div
    style={{
      padding: "14px 24px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#fff",
    }}
  >
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#9ca3af" }}>
        {new Date().toLocaleDateString("en-BD", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.background = "#2563eb")}
        onMouseOut={(e) => (e.target.style.background = "#3b82f6")}
      >
        🔄 Refresh
      </button>
    </div>
  </div>
);
// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
  <div
    style={{
      background: "#f9fafb",
      borderRadius: 12,
      padding: "14px 16px",
      border: "1px solid #e5e7eb",
    }}
  >
    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || "#111827" }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

// ─── REQUEST ROW ──────────────────────────────────────────────────────────────
const ReqRow = ({ r, onApprove, onReject, actionLabel = "Approve" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 0",
      borderBottom: "1px solid #f3f4f6",
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#dbeafe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#1e40af",
      }}
    >
      {(r.user?.name || r.user?.phone || r.userName || "U")
        .charAt(0)
        .toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
        {r.user?.name || r.user?.phone || r.userName || "Unknown"}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        {r.method || "bKash"} · {r.accountNo || ""} · {timeAgo(r.createdAt)}
      </div>
      {r.trxId && (
        <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 1 }}>
          TRX: {r.trxId}
        </div>
      )}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
      {fmt(r.amount)}
    </div>
    <button
      onClick={() => onApprove(r._id)}
      style={{
        fontSize: 11,
        padding: "4px 10px",
        background: "#d1fae5",
        color: "#065f46",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {actionLabel}
    </button>
    <button
      onClick={() => onReject(r._id)}
      style={{
        fontSize: 11,
        padding: "4px 10px",
        background: "#fee2e2",
        color: "#991b1b",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Reject
    </button>
  </div>
);

// ─── HISTORY ROW ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending: { bg: "#fff8e1", color: "#b45309", label: "Pending" },
  approved: { bg: "#e8f5e9", color: "#2e7d32", label: "Approved" },
  rejected: { bg: "#ffebee", color: "#c62828", label: "Rejected" },
};

const HistRow = ({ h }) => {
  const s = STATUS_MAP[h.status] || STATUS_MAP.pending;
  const formatDate = (d) =>
    new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        padding: "12px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      {/* User */}
      <div style={{ minWidth: 120, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {h.user?.name || h.user?.phone || "Unknown"}
        </div>
        {h.user?.name && (
          <div style={{ fontSize: 11, color: "#6b7280" }}>{h.user?.phone}</div>
        )}
      </div>

      {/* Amount */}
      <div
        style={{
          minWidth: 80,
          fontWeight: 700,
          fontSize: 14,
          color: "#1e3a8a",
        }}
      >
        ৳ {Number(h.amount).toLocaleString()}
      </div>

      {/* Method + Account */}
      <div style={{ minWidth: 130 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{h.method || "—"}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          {h.accountNo || h.trxId || "—"}
        </div>
      </div>

      {/* TrxID */}
      <div style={{ minWidth: 100, fontSize: 12, color: "#059669" }}>
        {h.trxId ? `TrxID: ${h.trxId}` : "—"}
      </div>

      {/* Date */}
      <div style={{ minWidth: 110, fontSize: 11, color: "#9ca3af" }}>
        {formatDate(h.createdAt)}
      </div>

      {/* Status */}
      <span
        style={{
          background: s.bg,
          color: s.color,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {s.label}
      </span>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PAGES
// ════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdraws, setRecentWithdraws] = useState([]);

  useEffect(() => {
    api("/admin/stats")
      .then((d) => setStats(d?.data || d || {}))
      .catch(() => {});
    api("/admin/deposits?status=approved&limit=3")
      .then((d) => {
        setRecentDeposits(
          Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [],
        );
      })
      .catch(() => {});
    api("/admin/withdraws?status=pending&limit=3")
      .then((d) => {
        setRecentWithdraws(
          Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [],
        );
      })
      .catch(() => {});
  }, []);

  const balance = (stats?.totalDeposit || 0) - (stats?.totalWithdraw || 0);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total deposited"
          value={fmt(stats?.totalDeposit)}
          color="#059669"
          sub="All time"
        />
        <StatCard
          label="Total withdrawn"
          value={fmt(stats?.totalWithdraw)}
          color="#dc2626"
          sub="All time"
        />
        <StatCard
          label="Balance"
          value={fmt(balance)}
          color={balance >= 0 ? "#059669" : "#dc2626"}
          sub="Deposit − Withdraw"
        />
        <StatCard
          label="Pending requests"
          value={(stats?.pendingDeposit || 0) + (stats?.pendingWithdraw || 0)}
          color="#d97706"
          sub="Needs action"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Recent approved deposits
          </div>
          {recentDeposits.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>No data</p>
          ) : (
            recentDeposits.map((h) => <HistRow key={h._id} h={h} />)
          )}
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Pending withdraw requests
          </div>
          {recentWithdraws.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>No pending</p>
          ) : (
            recentWithdraws.map((r) => (
              <div
                key={r._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {r.user?.name || r.user?.phone || "Unknown"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {r.method || ""} · {timeAgo(r.createdAt)}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmt(r.amount)}</div>
                <Badge color="amber">Pending</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CREATE MATCH ─────────────────────────────────────────────────────────────
const CreateMatch = () => {
  const [form, setForm] = useState({
    title: "",
    category: "br_match",
    entryFee: "",
    winPrize: "",
    totalPlayers: "",
    startTime: "",
    perKill: "",
    map: "",
    device: "Mobile",
    image: "",
    prizes: { first: "", second: "", third: "", fourth: "" },
  });
  const [msg, setMsg] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const maxWidth = 400;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setForm((p) => ({ ...p, image: canvas.toDataURL("image/jpeg", 0.6) }));
    };
    img.src = URL.createObjectURL(file);
  };

  const submit = async () => {
    if (!form.title || !form.startTime) {
      setMsg("❌ Title আর Start Time অবশ্যই দিন");
      return;
    }
    const d = await api("/matches/create", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setMsg(d.success ? "✅ Match created!" : "❌ " + (d.message || "Failed"));
    if (d.success)
      setForm({
        title: "",
        category: "br_match",
        entryFee: "",
        winPrize: "",
        totalPlayers: "",
        startTime: "",
        perKill: "",
        map: "",
        device: "Mobile",
        image: "",
        prizes: { first: "", second: "", third: "", fourth: "" },
      });
  };

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  const f = (k) => ({
    style: inp,
    value: form[k],
    onChange: (e) => setForm((p) => ({ ...p, [k]: e.target.value })),
  });
  const fp = (k) => ({
    style: inp,
    value: form.prizes[k],
    onChange: (e) =>
      setForm((p) => ({ ...p, prizes: { ...p.prizes, [k]: e.target.value } })),
  });

  return (
    <div style={{ padding: 24, maxWidth: 540 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
          🎮 New Match Create
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Match Title *
            </div>
            <input placeholder="যেমন: BR Match #1" {...f("title")} />
          </div>

          {/* Category */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Category
            </div>
            <select
              style={inp}
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {[
                { key: "br_match", label: "BR Match" },
                { key: "br_survival", label: "BR Survival" },
                { key: "clash_squad", label: "Clash Squad" },
                { key: "cs_2vs2", label: "CS 2vs2" },
                { key: "lone_wolf", label: "Lone Wolf" },
                { key: "training", label: "Training Match" },
              ].map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Start Time *{" "}
              <span style={{ color: "#f59e0b" }}>
                (এই সময়ের 20 মিনিট পরে match auto delete হবে)
              </span>
            </div>
            <input type="datetime-local" {...f("startTime")} />
          </div>

          {/* Entry Fee + Win Prize */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Entry & Prize
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <input placeholder="Entry Fee (৳)" {...f("entryFee")} />
              <input
                placeholder="Win Prize / Prize Pool (৳)"
                {...f("winPrize")}
              />
            </div>
          </div>

          {/* Prize Breakdown */}
          <div
            style={{
              background: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#92400e",
                marginBottom: 10,
              }}
            >
              🏆 Prize Breakdown (optional)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥇 1st Prize (৳)
                </div>
                <input
                  placeholder="যেমন: 60"
                  {...fp("first")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥈 2nd Prize (৳)
                </div>
                <input
                  placeholder="যেমন: 40"
                  {...fp("second")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  🥉 3rd Prize (৳)
                </div>
                <input
                  placeholder="যেমন: 20"
                  {...fp("third")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}
                >
                  4️⃣ 4th Prize (৳)
                </div>
                <input
                  placeholder="যেমন: 10"
                  {...fp("fourth")}
                  style={{ ...inp, background: "#fff" }}
                />
              </div>
            </div>
          </div>

          {/* Total Players + Per Kill */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Total Players
              </div>
              <input placeholder="যেমন: 48" {...f("totalPlayers")} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Per Kill (৳)
              </div>
              <input placeholder="যেমন: 5" {...f("perKill")} />
            </div>
          </div>

          {/* Map + Device */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Map
              </div>
              <select
                style={inp}
                value={form.map}
                onChange={(e) =>
                  setForm((p) => ({ ...p, map: e.target.value }))
                }
              >
                <option value="">Select Map</option>
                <option value="Bermuda">Bermuda</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Alpine">Alpine</option>
                <option value="Nexterra">Nexterra</option>
              </select>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Device
              </div>
              <select
                style={inp}
                value={form.device}
                onChange={(e) =>
                  setForm((p) => ({ ...p, device: e.target.value }))
                }
              >
                <option value="Mobile">Mobile</option>
                <option value="Emulator">Emulator</option>
                <option value="All">All Device</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Match Banner Image
            </div>
            <label
              style={{
                display: "block",
                padding: "12px",
                border: "1.5px dashed #d1d5db",
                borderRadius: 8,
                textAlign: "center",
                cursor: "pointer",
                fontSize: 13,
                color: "#6b7280",
                background: "#f9fafb",
              }}
            >
              📷 Image Upload করুন
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: "none" }}
              />
            </label>
            {form.image && (
              <div style={{ marginTop: 8, position: "relative" }}>
                <img
                  src={form.image}
                  alt=""
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <button
                  onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {msg && (
            <div
              style={{
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 6,
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
              }}
            >
              {msg}
            </div>
          )}

          <button
            onClick={submit}
            style={{
              padding: "12px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
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
    api("/admin/deposits?status=pending")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    await api(`/admin/deposits/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh();
  };
  const reject = async (id) => {
    await api(`/admin/deposits/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>Deposit requests</div>
          <Badge color="amber">{list.length} pending</Badge>
        </div>
        {list.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: 24,
            }}
          >
            No pending
          </p>
        ) : (
          list.map((r) => (
            <ReqRow key={r._id} r={r} onApprove={approve} onReject={reject} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── WITHDRAW REQUESTS ────────────────────────────────────────────────────────
const WithdrawRequests = ({ adminName, refresh }) => {
  const [list, setList] = useState([]);

  const load = useCallback(() => {
    api("/withdraw/admin/all?status=pending")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    await api(`/withdraw/admin/approve/${id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh();
  };

  const reject = async (id) => {
    await api(`/withdraw/admin/reject/${id}`, {
      method: "PUT",
      body: JSON.stringify({ adminName }),
    });
    load();
    refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>Withdraw requests</div>
          <Badge color="red">{list.length} pending</Badge>
        </div>
        {list.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: 24,
            }}
          >
            No pending
          </p>
        ) : (
          list.map((r) => (
            <ReqRow
              key={r._id}
              r={r}
              onApprove={approve}
              onReject={reject}
              actionLabel="Pay ✓"
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── MONEY OVERVIEW ───────────────────────────────────────────────────────────
const MoneyOverview = () => {
  const [stats, setStats] = useState({});
  useEffect(() => {
    api("/admin/stats")
      .then((d) => setStats(d?.data || d || {}))
      .catch(() => {});
  }, []);

  const rows = [
    {
      label: "Total user deposits (approved)",
      value: stats?.totalDeposit,
      color: "#059669",
    },
    {
      label: "Total user withdrawals (approved)",
      value: stats?.totalWithdraw,
      color: "#dc2626",
    },
    {
      label: "Net balance",
      value: (stats?.totalDeposit || 0) - (stats?.totalWithdraw || 0),
      color: "#2563eb",
    },
    {
      label: "Pending deposit amount",
      value: stats?.pendingDepositAmount,
      color: "#d97706",
    },
    {
      label: "Pending withdraw amount",
      value: stats?.pendingWithdrawAmount,
      color: "#d97706",
    },
    {
      label: "Total users",
      value: stats?.totalUsers,
      color: "#111827",
      isMoney: false,
    },
    {
      label: "Total matches",
      value: stats?.totalMatches,
      color: "#111827",
      isMoney: false,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          Money overview
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: i < rows.length - 1 ? "1px solid #f3f4f6" : "none",
            }}
          >
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
    const url =
      type === "withdraw" ? "/withdraw/admin/all" : `/admin/${type}s?limit=50`;

    api(url)
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, [type]);

  const filtered = list.filter((h) =>
    (h.user?.name || h.user?.phone || h.userName || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {type === "deposit" ? "Deposit" : "Withdraw"} history
          </div>
          <input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        {filtered.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: 24,
            }}
          >
            No records
          </p>
        ) : (
          filtered.map((h) => <HistRow key={h._id} h={h} />)
        )}
      </div>
    </div>
  );
};
// ─── USERS ────────────────────────────────────────────────────────────────────
const Users = () => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/admin/users")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  const toggleBan = async (id, banned) => {
    await api(`/admin/users/${id}/${banned ? "unban" : "ban"}`, {
      method: "PUT",
    });
    setList((l) =>
      l.map((u) => (u._id === id ? { ...u, isBlocked: !banned } : u)),
    );
  };

  const filtered = list.filter(
    (u) =>
      (u.name || u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search),
  );

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Users ({list.length})
          </div>
          <input
            placeholder="Search name / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
              outline: "none",
              width: 180,
            }}
          />
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Name/Phone", "Balance", "Status", "Action"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 10px",
                    textAlign: "left",
                    color: "#6b7280",
                    fontWeight: 600,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "9px 10px", fontWeight: 600 }}>
                  {u.name || u.phone}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  {fmt(u.balance)}
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <Badge color={u.isBlocked ? "red" : "green"}>
                    {u.isBlocked ? "Banned" : "Active"}
                  </Badge>
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <button
                    onClick={() => toggleBan(u._id, u.isBlocked)}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      background: u.isBlocked ? "#d1fae5" : "#fee2e2",
                      color: u.isBlocked ? "#065f46" : "#991b1b",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
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
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [roomData, setRoomData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({});

  const loadMatches = useCallback(() => {
    api("/matches").then((d) => {
      const data = Array.isArray(d) ? d : d?.data || [];
      setMatches(data.filter((m) => m.status !== "completed"));
    });
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // ✅ Match select → joined players automatic load
  const handleMatchSelect = (id) => {
    const match = matches.find((m) => m._id === id);
    setSelectedMatch(match || null);
    setResults([]);

    const joined = (match?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    console.log("Joined players:", joined);
    setPlayers(joined);
  };

  // ✅ সব players একসাথে add
  const addAllPlayers = () => {
    const allResults = players.map((p) => ({
      userId: p.userId,
      inGameName: p.inGameName,
      position: "",
      kills: 0,
    }));
    setResults(allResults);
  };

  // ✅ একজন একজন করে add
  const addPlayerResult = () => {
    setResults([
      ...results,
      {
        userId: "",
        inGameName: "",
        position: "",
        kills: 0,
      },
    ]);
  };

  const handlePlayerSelect = (index, userId) => {
    const player = players.find((p) => p.userId === userId);
    const updated = [...results];
    updated[index].userId = userId;
    updated[index].inGameName = player?.inGameName || "";
    setResults(updated);
  };

  const handleResultChange = (index, field, value) => {
    const updated = [...results];
    updated[index][field] = value;
    setResults(updated);
  };

  const removePlayer = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const calculatePrize = (position, kills) => {
    if (!selectedMatch) return 0;
    let prize = (kills || 0) * (selectedMatch.perKill || 0);
    if (position == 1) prize += selectedMatch.prizes?.first || 0;
    else if (position == 2) prize += selectedMatch.prizes?.second || 0;
    else if (position == 3) prize += selectedMatch.prizes?.third || 0;
    else if (position == 4) prize += selectedMatch.prizes?.fourth || 0;
    return Math.floor(prize);
  };

  const isAlreadyAdded = (userId, currentIndex) =>
    results.some((r, i) => i !== currentIndex && r.userId === userId);

  // ✅ Total prize preview
  const totalPrize = results.reduce(
    (sum, r) => sum + calculatePrize(r.position, r.kills),
    0,
  );

  const updateRoom = async (id) => {
    const d = await api(`/matches/update-room/${id}`, {
      method: "PUT",
      body: JSON.stringify(roomData[id] || {}),
    });
    setMessage((p) => ({
      ...p,
      [id]: d.success ? "✅ Room Updated!" : "❌ Failed",
    }));
    if (d.success) loadMatches();
  };

  // ✅ Submit
  const submitResult = async () => {
    if (!selectedMatch) return alert("Match সিলেক্ট করুন");
    if (results.length === 0) return alert("কমপক্ষে ১ জন player যোগ করুন");

    const hasEmpty = results.some((r) => !r.userId);
    if (hasEmpty) return alert("সব player select করুন");

    // duplicate position check (0 বা empty বাদে)
    const positions = results
      .map((r) => Number(r.position))
      .filter((p) => p > 0);
    if (positions.length !== new Set(positions).size) {
      return alert("একই position দুজনকে দেওয়া যাবে না");
    }

    setLoading(true);
    try {
      const response = await api(`/admin/matches/${selectedMatch._id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          results: results.map((r) => ({
            userId: r.userId,
            inGameName: r.inGameName,
            position: Number(r.position) || 0,
            kills: Number(r.kills) || 0,
          })),
        }),
      });

      if (response.success) {
        alert("✅ Result submit হয়েছে! Prize distribute হয়েছে।");
        setResults([]);
        setSelectedMatch(null);
        setPlayers([]);
        loadMatches();
      } else {
        alert("❌ " + (response.message || "Failed"));
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        🏆 Match Result Submit & Prize Distribution
      </h1>

      {/* Match Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select Match
        </label>
        <select
          onChange={(e) => handleMatchSelect(e.target.value)}
          value={selectedMatch?._id || ""}
          style={{
            width: "100%",
            maxWidth: 600,
            padding: 14,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        >
          <option value="">-- Select Match --</option>
          {matches.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title} • {m.status} • {m.joinedPlayers || 0}/{m.totalPlayers}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h2 style={{ marginBottom: 20 }}>Match: {selectedMatch.title}</h2>

          {/* Prize Info */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 10,
              padding: 12,
              marginBottom: 20,
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>🥇 1st: ৳{selectedMatch.prizes?.first || 0}</span>
            <span>🥈 2nd: ৳{selectedMatch.prizes?.second || 0}</span>
            <span>🥉 3rd: ৳{selectedMatch.prizes?.third || 0}</span>
            <span>4️⃣ 4th: ৳{selectedMatch.prizes?.fourth || 0}</span>
            <span>🔫 Per Kill: ৳{selectedMatch.perKill || 0}</span>
          </div>

          {/* Joined Players Preview */}
          {players.length > 0 && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{ fontWeight: 700, color: "#15803d", marginBottom: 10 }}
              >
                📋 Joined Players ({players.length} জন)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {players.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #86efac",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#166534",
                    }}
                  >
                    {p.inGameName
                      ? `${p.inGameName} — Slot #${p.slotNumber}`
                      : `Slot #${p.slotNumber}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Room Update */}
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h3 style={{ marginBottom: 12, color: "#0369a1" }}>
              🔑 Room Details
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Room ID</div>
                <input
                  placeholder="Room ID"
                  defaultValue={selectedMatch.roomId || ""}
                  onChange={(e) =>
                    setRoomData((p) => ({
                      ...p,
                      [selectedMatch._id]: {
                        ...p[selectedMatch._id],
                        roomId: e.target.value,
                      },
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #bae6fd",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Password</div>
                <input
                  placeholder="Room Password"
                  defaultValue={selectedMatch.roomPassword || ""}
                  onChange={(e) =>
                    setRoomData((p) => ({
                      ...p,
                      [selectedMatch._id]: {
                        ...p[selectedMatch._id],
                        roomPassword: e.target.value,
                      },
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #bae6fd",
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => updateRoom(selectedMatch._id)}
              style={{
                width: "100%",
                padding: 10,
                background: "#0284c7",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Update Room Details
            </button>
            {message[selectedMatch._id] && (
              <p style={{ marginTop: 8, color: "#0369a1", fontWeight: 600 }}>
                {message[selectedMatch._id]}
              </p>
            )}
          </div>

          {/* Result Input */}
          <h3 style={{ marginBottom: 12 }}>🎮 Player Results</h3>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {/* ✅ সব players একসাথে add */}
            <button
              onClick={addAllPlayers}
              disabled={
                players.length === 0 || results.length === players.length
              }
              style={{
                padding: "10px 20px",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                opacity:
                  players.length === 0 || results.length === players.length
                    ? 0.5
                    : 1,
              }}
            >
              ⚡ Add All {players.length} Players
            </button>

            {/* একজন একজন add */}
            <button
              onClick={addPlayerResult}
              disabled={results.length >= players.length && players.length > 0}
              style={{
                padding: "10px 20px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                opacity:
                  results.length >= players.length && players.length > 0
                    ? 0.5
                    : 1,
              }}
            >
              + Add Player
            </button>
          </div>

          {/* Result Rows */}
          {results.map((res, index) => (
            <div
              key={index}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 120px 100px 110px 50px",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                {/* Player */}
                <div>
                  <div
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    Player
                  </div>
                  {/* ✅ Add All করলে already set — dropdown দিয়েও change করা যাবে */}
                  <select
                    value={res.userId}
                    onChange={(e) => handlePlayerSelect(index, e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
                  >
                    <option value="">-- Select --</option>
                    {players.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={isAlreadyAdded(p.userId, index)}
                      >
                        {p.inGameName
                          ? `${p.inGameName} — Slot #${p.slotNumber}`
                          : `Slot #${p.slotNumber}`}
                      </option>
                    ))}
                  </select>
                  {res.inGameName && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#16a34a",
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      ✅ {res.inGameName}
                    </div>
                  )}
                </div>

                {/* Position */}
                <div>
                  <div
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    Position
                  </div>
                  <select
                    value={res.position}
                    onChange={(e) =>
                      handleResultChange(index, "position", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">—</option>
                    {[
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                      32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
                      46, 47, 48,
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kills */}
                <div>
                  <div
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    Kills
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={res.kills}
                    onChange={(e) =>
                      handleResultChange(
                        index,
                        "kills",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                {/* Prize */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    Prize
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color:
                        calculatePrize(res.position, res.kills) > 0
                          ? "#16a34a"
                          : "#9ca3af",
                    }}
                  >
                    ৳{calculatePrize(res.position, res.kills)}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removePlayer(index)}
                  style={{
                    background: "#fee2e2",
                    border: "none",
                    borderRadius: 6,
                    color: "#dc2626",
                    fontWeight: 700,
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Total Prize Preview */}
          {results.length > 0 && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: 14,
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, color: "#15803d" }}>
                Total Prize Distribution
              </span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#15803d" }}>
                ৳{totalPrize}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submitResult}
            disabled={loading || results.length === 0}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 16,
              background: loading ? "#9ca3af" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Submitting..."
              : `✅ Submit Result & Distribute Prize (${results.length} players)`}
          </button>
        </div>
      )}
    </div>
  );
};
// ─── PAYMENT NUMBERS ──────────────────────────────────────────────────────────
const PaymentNumbers = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    method: "bKash",
    number: "",
    limit: "",
    active: true,
  });
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(() => {
    api("/admin/payment-numbers")
      .then((d) => {
        setList(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.number) {
      setMsg("❌ নম্বর দিন");
      return;
    }
    const d = await api("/admin/payment-numbers", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        limit: form.limit ? Number(form.limit) : undefined,
      }),
    });
    setMsg(d.success ? "✅ সংরক্ষিত হয়েছে!" : "❌ " + (d.message || "Failed"));
    if (d.success) {
      setForm({ method: "bKash", number: "", limit: "", active: true });
      load();
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const toggle = async (id, active) => {
    await api(`/admin/payment-numbers/${id}`, {
      method: "PUT",
      body: JSON.stringify({ active: !active }),
    });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("এই নম্বরটি মুছে ফেলবেন?")) return;
    await api(`/admin/payment-numbers/${id}`, { method: "DELETE" });
    load();
  };

  const startEdit = (n) => {
    setEditId(n._id);
    setEditForm({
      method: n.method,
      number: n.number,
      limit: n.limit || "",
      active: n.active,
    });
  };

  const saveEdit = async () => {
    await api(`/admin/payment-numbers/${editId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...editForm,
        limit: editForm.limit ? Number(editForm.limit) : undefined,
      }),
    });
    setEditId(null);
    load();
  };

  const inp = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const methodColors = {
    bKash: "#be185d",
    Nagad: "#ea580c",
    Rocket: "#7c3aed",
  };
  const methodBadge = { bkash: "pink", Nagad: "orange", Rocket: "purple" };
  const methodEmoji = { bkash: "🩷", Nagad: "🧡", Rocket: "💜" };

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* ── Add Form ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 16,
            color: "#111827",
          }}
        >
          💳 নতুন নম্বর যোগ করুন
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              মেথড বেছে নিন
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
              }}
            >
              {["bkash", "nagad", "rocket"].map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((p) => ({ ...p, method: m }))}
                  style={{
                    padding: "8px 4px",
                    borderRadius: 8,
                    border: "2px solid",
                    borderColor:
                      form.method === m ? methodColors[m] : "#e5e7eb",
                    background:
                      form.method === m ? methodColors[m] + "18" : "#f9fafb",
                    color: form.method === m ? methodColors[m] : "#6b7280",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {methodEmoji[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              নম্বর *
            </div>
            <input
              style={inp}
              placeholder="যেমন: 01XXXXXXXXX"
              value={form.number}
              onChange={(e) =>
                setForm((p) => ({ ...p, number: e.target.value }))
              }
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              সর্বোচ্চ লিমিট (ঐচ্ছিক)
            </div>
            <input
              style={inp}
              placeholder="যেমন: 10000"
              value={form.limit}
              onChange={(e) =>
                setForm((p) => ({ ...p, limit: e.target.value }))
              }
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((p) => ({ ...p, active: e.target.checked }))
              }
            />
            <span style={{ fontWeight: 600, color: "#374151" }}>
              Active রাখুন
            </span>
          </label>

          {msg && (
            <div
              style={{
                fontSize: 12,
                padding: "7px 10px",
                borderRadius: 6,
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#dc2626",
                fontWeight: 600,
              }}
            >
              {msg}
            </div>
          )}

          <button
            onClick={save}
            style={{
              padding: "10px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            💾 Save করুন
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            সব নম্বর
          </div>
          <Badge color="blue">{list.length} টি</Badge>

          <button
            onClick={load}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              background: "#dbeafe",
              color: "#1e40af",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              এখনো কোনো নম্বর যোগ করা হয়নি
            </p>
          </div>
        ) : (
          list.map((n) => (
            <div
              key={n._id}
              style={{
                border: "1px solid #f3f4f6",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 8,
                background: n.active ? "#fafafa" : "#f9f9f9",
                opacity: n.active ? 1 : 0.65,
              }}
            >
              {editId === n._id ? (
                // ── Edit Mode ──
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <select
                      value={editForm.method}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, method: e.target.value }))
                      }
                      style={{ ...inp, padding: "7px 10px" }}
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                    </select>
                    <input
                      style={{ ...inp, padding: "7px 10px" }}
                      placeholder="নম্বর"
                      value={editForm.number}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, number: e.target.value }))
                      }
                    />
                  </div>
                  <input
                    style={{ ...inp, padding: "7px 10px" }}
                    placeholder="লিমিট (ঐচ্ছিক)"
                    value={editForm.limit}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, limit: e.target.value }))
                    }
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={saveEdit}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: "#059669",
                        color: "#fff",
                        border: "none",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ✅ Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "none",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              ) : (
                // ── View Mode ──
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: methodColors[n.method] || "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {methodEmoji[n.method] || "💳"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <Badge color={methodBadge[n.method] || "gray"}>
                        {n.method}
                      </Badge>
                      <Badge color={n.active ? "green" : "red"}>
                        {n.active ? "Active" : "Off"}
                      </Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111827",
                        letterSpacing: 0.5,
                      }}
                    >
                      {n.number}
                    </div>
                    {n.limit && (
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}
                      >
                        লিমিট: ৳{Number(n.limit).toLocaleString("bn-BD")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => toggle(n._id, n.active)}
                      style={{
                        fontSize: 11,
                        padding: "4px 9px",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        background: n.active ? "#fef3c7" : "#d1fae5",
                        color: n.active ? "#92400e" : "#065f46",
                      }}
                    >
                      {n.active ? "বন্ধ" : "চালু"}
                    </button>
                    <button
                      onClick={() => startEdit(n)}
                      style={{
                        fontSize: 11,
                        padding: "4px 9px",
                        background: "#dbeafe",
                        color: "#1e40af",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => remove(n._id)}
                      style={{
                        fontSize: 11,
                        padding: "4px 9px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api("/admin/logs")
      .then((d) => {
        setLogs(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  const colorMap = {
    approve: "green",
    reject: "red",
    create: "blue",
    ban: "amber",
    login: "gray",
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Admin activity log
        </div>
        {logs.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              padding: 24,
            }}
          >
            No logs yet
          </p>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "9px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(l.adminName || "A").charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {l.adminName}{" "}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {l.action}{" "}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {l.target}
                </span>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {timeAgo(l.createdAt)}
                </div>
              </div>
              <Badge color={colorMap[l.type] || "gray"}>{l.type}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── MANAGE ADMINS ────────────────────────────────────────────────────────────
const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "admin",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/admin/admins")
      .then((d) => {
        setAdmins(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => {});
  }, []);

  const create = async () => {
    const d = await api("/admin/admins/create", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setMsg(d.success ? "✅ Admin created!" : "❌ " + (d.message || "Failed"));
    if (d.success) {
      setForm({ name: "", phone: "", password: "", role: "admin" });
      if (d.admin) setAdmins((p) => [...p, d.admin]);
    }
  };

  const inp = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Add new admin
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Name"
            style={inp}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Phone"
            style={inp}
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            placeholder="Password"
            type="password"
            style={inp}
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <select
            style={inp}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
            <option value="finance">Finance only</option>
          </select>
          {msg && (
            <div
              style={{
                fontSize: 12,
                padding: "6px 10px",
                background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("✅") ? "#065f46" : "#991b1b",
                borderRadius: 6,
              }}
            >
              {msg}
            </div>
          )}
          <button
            onClick={create}
            style={{
              padding: 10,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create admin
          </button>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          All admins
        </div>
        {admins.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No admins yet</p>
        ) : (
          admins.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1e40af",
                }}
              >
                {(a.name || a.phone || "A").charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.name || a.phone}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{a.phone}</div>
              </div>
              <Badge color={a.role === "super-admin" ? "blue" : "gray"}>
                {a.role}
              </Badge>
            </div>
          ))
        )}
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
    setLoading(true);
    setErr("");
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
      } else setErr(d.message || "Login failed");
    } catch {
      setErr("Server error");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          width: 340,
          background: "#1e293b",
          borderRadius: 16,
          padding: 28,
          border: "1px solid #334155",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎮</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
            Admin Login
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Free Fire Tournament
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            style={{
              padding: "11px 12px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
            }}
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{
              padding: "11px 12px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
            }}
          />
          {err && (
            <div
              style={{
                fontSize: 12,
                color: "#f87171",
                background: "#450a0a",
                padding: "6px 10px",
                borderRadius: 6,
              }}
            >
              {err}
            </div>
          )}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "11px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
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
    api("/admin/deposits?status=pending")
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setBadges((p) => ({ ...p, deposit: arr.length }));
      })
      .catch(() => {});

    api("/withdraw/admin/all?status=pending")
      .then((d) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setBadges((p) => ({ ...p, withdraw: arr.length }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const saved = localStorage.getItem("adminInfo");
    if (token && saved) {
      try {
        setAdmin(JSON.parse(saved));
        loadBadges();
      } catch {
        localStorage.removeItem("adminInfo");
      }
    }
  }, [loadBadges]);

  const handleLogin = (a) => {
    console.log("Admin login data:", a); // ← দেখুন কী আসছে
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
    dashboard: ["Dashboard", "Overview of all activity"],
    "create-match": ["Create match", "Add a new tournament match"],
    "match-results": ["Match results", "Set Room ID/Password & Winner"],
    "deposit-requests": [
      "Deposit requests",
      "Approve or reject incoming deposits",
    ],
    "withdraw-requests": [
      "Withdraw requests",
      "Process user withdrawal requests",
    ],
    "money-overview": ["Money overview", "Full financial summary"],
    "deposit-history": ["Deposit history", "All deposit transactions"],
    "withdraw-history": ["Withdraw history", "All withdrawal transactions"],
    users: ["Users", "Manage all users"],
    "activity-log": ["Activity log", "All admin actions"],
    "manage-admins": ["Manage admins", "Add or manage admin accounts"],
    "payment-numbers": ["Payment Numbers", "Deposit number manage করুন"],
  };

  const [title, sub] = titles[page] || ["Admin", ""];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        admin={admin}
        onLogout={handleLogout}
        badges={badges}
      />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <Topbar
          title={title}
          sub={sub}
          onRefresh={() => {
            window.location.reload(); // Full Refresh
            // অথবা selective refresh (ভালো প্র্যাকটিস)
            // loadBadges();
          }}
        />
        {page === "dashboard" && <Dashboard />}
        {page === "create-match" && <CreateMatch />}
        {page === "match-results" && <MatchResults />}
        {page === "deposit-requests" && (
          <DepositRequests
            adminName={admin.name || admin.phone}
            refresh={loadBadges}
          />
        )}
        {page === "withdraw-requests" && (
          <WithdrawRequests
            adminName={admin.name || admin.phone}
            refresh={loadBadges}
          />
        )}
        {page === "money-overview" && <MoneyOverview />}
        {page === "deposit-history" && <History type="deposit" />}
        {page === "withdraw-history" && <History type="withdraw" />}
        {page === "users" && <Users />}
        {page === "activity-log" && <ActivityLog />}
        {page === "manage-admins" && <ManageAdmins />}
        {page === "payment-numbers" && <PaymentNumbers />}
      </main>
    </div>
  );
};

export default AdminPanel;
