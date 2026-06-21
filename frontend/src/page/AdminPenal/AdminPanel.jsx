 // src/page/AdminPenal/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/adminApi";
import AdminLogin from "../AdminPenal/AdminLogin";
import Sidebar from "../../Component/Admin/Sidebar/Sidebar";

import Dashboard        from "../Admin/AdminDashboard/AdminDashboard";
import CreateMatch      from "../Admin/CreateMatch/CreateMatch";
import MatchResults     from "../Admin/MatchResultSubmit";
import MoneyOverview    from "../Admin/MoneyOverview/MoneyOverview";
import TransactionHistory from "../Admin/TransactionHistory/TransactionHistory";
import Users            from "../Admin/UserManager/UserManager";
import ActivityLog      from "../Admin/ActivityLog/ActivityLog";
import ManageAdmins     from "../Admin/ManageAdmins/ManageAdmins";
import PaymentNumbers   from "../../Component/PaymentNumberManager/paymentNumberManager";

const AdminPanel = () => {
  const [admin,  setAdmin]  = useState(null);
  const [page,   setPage]   = useState("dashboard");
  const [badges, setBadges] = useState({ deposit: 0, withdraw: 0 });

  // ✅ Sidebar badge — deposit + withdraw pending count
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
    const token      = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("adminInfo");
    if (token && savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
        loadBadges();
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setAdmin(null);
      }
    } else {
      setAdmin(null);
    }
  }, [loadBadges]);

  const handleLogin = (a) => { setAdmin(a); loadBadges(); };
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
    setPage("dashboard");
  };

  if (!admin) return <AdminLogin onLoginSuccess={handleLogin} />;

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f9fafb", fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar
        page={page}
        setPage={setPage}
        admin={admin}
        onLogout={handleLogout}
        badges={badges}
      />
      <main style={{ flex: 1, overflowY: "auto" }}>

        {page === "dashboard"         && <Dashboard />}
        {page === "create-match"      && <CreateMatch />}
        {page === "match-results"     && <MatchResults />}

        {/* ✅ সব transaction related page এখন একটাই component
            — deposit-requests, withdraw-requests, deposit-history,
              withdraw-history সব বাদ, শুধু "transaction-history" */}
        {page === "transaction-history" && (
          <TransactionHistory onBadgeUpdate={loadBadges} />
        )}

        {page === "money-overview"    && <MoneyOverview />}
        {page === "users"             && <Users />}
        {page === "activity-log"      && <ActivityLog />}
        {page === "manage-admins"     && <ManageAdmins />}
        {page === "payment-numbers"   && <PaymentNumbers />}

      </main>
    </div>
  );
};

export default AdminPanel;