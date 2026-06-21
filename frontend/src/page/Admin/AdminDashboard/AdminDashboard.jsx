 // page/Admin/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { api, fmt, timeAgo } from "../../../utils/adminApi";

const StatCard = ({ icon, label, value, sub, bg, color }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: color || "#111" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg || "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, dRes, wRes] = await Promise.all([
          api("/admin/stats"),
          api("/admin/deposits?status=pending&limit=5"),
          api("/withdraw/admin/all?status=pending&limit=5"),
        ]);
        if (sRes && !sRes.error) setStats(sRes?.data || sRes);
        setDeposits(Array.isArray(dRes) ? dRes.slice(0, 5) : Array.isArray(dRes?.data) ? dRes.data.slice(0, 5) : []);
        setWithdraws(Array.isArray(wRes) ? wRes.slice(0, 5) : Array.isArray(wRes?.data) ? wRes.data.slice(0, 5) : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>

      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111" }}>Dashboard</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>সব কার্যক্রমের সংক্ষিপ্ত বিবরণ</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <StatCard icon="👥" label="মোট ইউজার" value={s.totalUsers ?? "—"} sub="Registered users" bg="#dbeafe" color="#1e40af" />
        <StatCard icon="🎮" label="মোট ম্যাচ"  value={s.totalMatches ?? "—"} sub="All matches" bg="#d1fae5" color="#065f46" />
        <StatCard icon="💰" label="মোট ডিপোজিট" value={s.totalDeposit ? fmt(s.totalDeposit) : "—"} sub="Approved amount" bg="#fef3c7" color="#92400e" />
        <StatCard icon="🏧" label="মোট উত্তোলন" value={s.totalWithdraw ? fmt(s.totalWithdraw) : "—"} sub="Paid amount" bg="#fce7f3" color="#9d174d" />
        <StatCard icon="⏳" label="Pending Deposit"  value={s.pendingDeposits ?? deposits.length} sub="Waiting approval" bg="#fee2e2" color="#dc2626" />
        <StatCard icon="⌛" label="Pending Withdraw" value={s.pendingWithdraws ?? withdraws.length} sub="Waiting payment" bg="#ede9fe" color="#7c3aed" />
      </div>

      {/* Pending Deposits */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", marginBottom: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>💰 সাম্প্রতিক Deposit Request</div>
          {deposits.length > 0 && (
            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {deposits.length} pending
            </span>
          )}
        </div>
        {deposits.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>কোনো pending deposit নেই ✅</div>
        ) : (
          deposits.map((r) => (
            <div key={r._id} style={{ padding: "12px 18px", borderBottom: "1px solid #f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.userName || r.name || "Unknown"}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{r.method?.toUpperCase()} · TrxID: {r.trxId}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(r.createdAt)}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#065f46" }}>{fmt(r.amount)}</div>
            </div>
          ))
        )}
      </div>

      {/* Pending Withdraws */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🏧 সাম্প্রতিক Withdraw Request</div>
          {withdraws.length > 0 && (
            <span style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {withdraws.length} pending
            </span>
          )}
        </div>
        {withdraws.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>কোনো pending withdraw নেই ✅</div>
        ) : (
          withdraws.map((r) => (
            <div key={r._id} style={{ padding: "12px 18px", borderBottom: "1px solid #f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.userName || r.name || "Unknown"}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{r.method?.toUpperCase()} · {r.accountNo}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(r.createdAt)}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#7c3aed" }}>{fmt(r.amount)}</div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Dashboard;