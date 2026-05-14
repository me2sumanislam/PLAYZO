 import React, { useState } from "react";
import MatchManager from "../MatchManager.jsx/MatchManager";
import DepositRequests from "../DepositeRequest/DepositeRequest";
import WithdrawRequests from "../WithdrawRequest/withdrawRequest";
import UserManager from "../UserManager/UserManager";

const AdminDashboard = ({ onBack }) => {
  const [tab, setTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "matches", label: "Matches", icon: "🎮" },
    { id: "deposits", label: "Deposits", icon: "💰" },
    { id: "withdraws", label: "Withdraws", icon: "🏧" },
    { id: "users", label: "Users", icon: "👥" },
  ];

  const renderContent = () => {
    switch (tab) {
      case "matches":
        return <MatchManager />;
      case "deposits":
        return <DepositRequests />;
      case "withdraws":
        return <WithdrawRequests />;
      case "users":
        return <UserManager />;
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
        <span></span>
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