 import React, { useState } from "react";
import api from "../../../utils/api";
import AdminLogin from "../../AdminPenal/AdminLogin";
import MatchManager from "../MatchManager.jsx/MatchManager";
import MatchResultSubmit from "../MatchResultSubmit";
import DepositRequests from "../DepositeRequest/DepositeRequest";
import WithdrawRequests from "../WithdrawRequest/withdrawRequest";
import UserManager from "../UserManager/UserManager";
import PaymentNumbers from "../../../Component/PaymentNumberManager/paymentNumberManager";
import AdminHistory from "../AdminHistory/AdminHistory";
// PaymentNumbers কম্পোনেন্ট api(path, method, body) ফরম্যাটে কল করে,
// কিন্তু আমাদের utils/api ফাংশন api(path, { method, body }) ফরম্যাট নেয়।
// এই adapter দুটোর মধ্যে সেতু হিসেবে কাজ করে।
const apiAdapter = (path, method, body) =>
  api(path, {
    method: method || "GET",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const AdminDashboard = ({ onBack }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("adminInfo");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState("dashboard");

  if (!admin) {
    return <AdminLogin onLoginSuccess={(a) => setAdmin(a)} />;
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "matches", label: "Matches", icon: "🎮" },
    { id: "results", label: "Results", icon: "🏆" },
    { id: "deposits", label: "Deposits", icon: "💰" },
    { id: "withdraws", label: "Withdraws", icon: "🏧" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "payments", label: "Payments", icon: "📱" },
    { id: "history", label: "History", icon: "📜" },
  ];

  const renderContent = () => {
    switch (tab) {
      case "matches":
        return <MatchManager />;
      case "results":
        return <MatchResultSubmit />;
      case "deposits":
        return <DepositRequests />;
      case "withdraws":
        return <WithdrawRequests />;
      case "users":
        return <UserManager />;
      case "payments":
        return <PaymentNumbers api={apiAdapter} />;
      case "history":
        return <AdminHistory />;
      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-sm">Total Users</p>
              <h2 className="text-2xl font-black">120</h2>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-sm">Matches</p>
              <h2 className="text-2xl font-black">18</h2>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto">
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <button onClick={onBack}>❮</button>
        <h2 className="font-black text-lg">Admin Panel</h2>
        <button
          onClick={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminInfo");
            setAdmin(null);
          }}
          className="text-xs font-bold"
        >
          লগআউট
        </button>
      </div>

      <div className="flex overflow-x-auto bg-white border-b">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold ${
              tab === item.id
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            <div>{item.icon}</div>
            <div>{item.label}</div>
          </button>
        ))}
      </div>

      <div className="p-4">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;