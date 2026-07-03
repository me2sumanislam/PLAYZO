 // src/Component/Admin/Sidebar/Sidebar.jsx
import React from "react";

export const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "⊞",
    roles: ["super-admin", "admin", "finance"],
  },
  {
    key: "create-match",
    label: "Create Match",
    icon: "＋",
    roles: ["super-admin", "admin"],
  },
  {
    // ✅ deposit-requests + withdraw-requests + deposit-history + withdraw-history
    // সব এখন একটাই "Transaction History" — ভেতরে tab আছে
    key: "transaction-history",
    label: "Transaction History",
    icon: "📜",
    badge: "transactions", // withdraw + deposit pending মিলিয়ে
    roles: ["super-admin", "finance"],
  },
  {
    key: "money-overview",
    label: "Money Overview",
    icon: "₹",
    roles: ["super-admin", "finance"],
  },
  {
    key: "users",
    label: "Users",
    icon: "👥",
    roles: ["super-admin", "admin"],
  },
  {
    key: "match-results",
    label: "Match Results",
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
    // ✅ নতুন — Gem Referral System এর fraud detection page
    key: "referral-fraud",
    label: "Referral Fraud Alerts",
    icon: "⚠️",
    roles: ["super-admin", "admin"],
  },
  {
    key: "activity-log",
    label: "Activity Log",
    icon: "📋",
    roles: ["super-admin", "admin"],
  },
  {
    key: "manage-admins",
    label: "Manage Admins",
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
    {/* Logo */}
    <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #1e293b" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", letterSpacing: 1 }}>
        🎮 FF ADMIN
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
        Free Fire Tournament
      </div>
    </div>

    {/* Admin Info */}
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

    {/* Nav Items */}
    <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
      {NAV.filter((n) => n.roles.includes(admin?.role)).map((n) => {
        // ✅ transaction-history badge = deposit pending + withdraw pending
        const cnt =
          n.badge === "transactions"
            ? (badges.deposit || 0) + (badges.withdraw || 0)
            : n.badge === "deposit"
            ? badges.deposit || 0
            : n.badge === "withdraw"
            ? badges.withdraw || 0
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
                  fontWeight: 700,
                  minWidth: 16,
                  textAlign: "center",
                }}
              >
                {cnt}
              </span>
            )}
          </div>
        );
      })}
    </nav>

    {/* Sign Out */}
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

export default Sidebar;