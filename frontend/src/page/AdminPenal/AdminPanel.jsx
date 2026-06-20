 import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/adminApi";
import AdminLogin from "../AdminPenal/AdminLogin";
import Sidebar from "../../Component/Admin/Sidebar/Sidebar";
 

import Login from "../../Component/Login/Login";
import Dashboard from "../Admin/AdminDashboard/AdminDashboard";
import CreateMatch from "../Admin/CreateMatch/CreateMatch";
import MatchResults from "../../Component/MatchResults/MatchResults";
import DepositRequests from "../Admin/DepositeRequest/DepositeRequest";
import WithdrawRequests from "../Admin/WithdrawRequest/withdrawRequest";
import MoneyOverview from "../Admin/MoneyOverview/MoneyOverview";
import History from "../Admin/AdminHistory/AdminHistory";
 import Users from "../Admin/UserManager/UserManager";
import ActivityLog from "../Admin/ActivityLog/ActivityLog";
import ManageAdmins from "../Admin/ManageAdmins/ManageAdmins";
import PaymentNumbers from "../../Component/PaymentNumberManager/paymentNumberManager";

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
    const savedAdmin = localStorage.getItem("adminInfo");
    if (token && savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdmin(adminData);
        loadBadges();
      } catch (e) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setAdmin(null);
      }
    } else {
      setAdmin(null);
    }
  }, [loadBadges]);

  const handleLogin = (a) => {
    setAdmin(a);
    loadBadges();
  };
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
    setPage("dashboard");
  };

 if (!admin) return <AdminLogin onLoginSuccess={handleLogin} />;

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

  const [title, sub] = titles[page] || ["Admin Panel", ""];

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
        {/* {/* <Topbar
          title={title}
          sub={sub}
          onRefresh={() => window.location.reload()}
        /> */}
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