 import React, { useState, useEffect } from "react";
import { api, fmt } from "../../../utils/adminApi";

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

export default MoneyOverview;