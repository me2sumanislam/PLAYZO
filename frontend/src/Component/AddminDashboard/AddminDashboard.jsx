 import React, { useState, useEffect } from "react";
import PaymentNumberManager from "../PaymentNumberManager/PaymentNumberManager";

// DepositRequests component
const DepositRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState("pending");

  useEffect(() => {
    const load = () => {
      const data = JSON.parse(localStorage.getItem("deposit_requests") || "[]");
      setRequests(data);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id, status) => {
    const updated = requests.map((r) => r.id === id ? { ...r, status } : r);
    setRequests(updated);
    localStorage.setItem("deposit_requests", JSON.stringify(updated));

    if (status === "approved") {
      const req = requests.find((r) => r.id === id);
      const current = parseInt(localStorage.getItem("user_balance") || "0");
      localStorage.setItem("user_balance", String(current + parseInt(req.amount)));
    }
  };

  const filtered = requests.filter((r) => filter === "all" ? true : r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow flex justify-between items-center">
        <div>
          <h3 className="font-black text-indigo-700 text-base">💰 Deposit Requests</h3>
          <p className="text-xs text-gray-400">মোট: {requests.length} | Pending: <span className="text-orange-500 font-bold">{pendingCount}</span></p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
            {pendingCount} নতুন
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {[
          { id: "pending",  label: "⏳ Pending"  },
          { id: "approved", label: "✅ Approved" },
          { id: "rejected", label: "❌ Rejected" },
          { id: "all",      label: "📋 সব"       },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              filter === f.id ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 text-sm font-bold">কোনো request নেই</p>
        </div>
      )}

      {filtered.slice().reverse().map((req) => (
        <div
          key={req.id}
          className={`rounded-2xl p-4 shadow border ${
            req.status === "pending"  ? "bg-yellow-50 border-yellow-200"
            : req.status === "approved" ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-black text-sm">👤 {req.user}</p>
              <p className="text-xs text-gray-500">{req.phone}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{req.time}</p>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              req.status === "pending"  ? "bg-yellow-100 text-yellow-700"
              : req.status === "approved" ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}>
              {req.status === "pending" ? "⏳ Pending" : req.status === "approved" ? "✅ Approved" : "❌ Rejected"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2 text-center">
              <p className="text-[10px] text-gray-400">পরিমাণ</p>
              <p className="font-black text-green-600 text-sm">৳{req.amount}</p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center">
              <p className="text-[10px] text-gray-400">Method</p>
              <p className="font-bold text-xs">{req.method}</p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center col-span-2">
              <p className="text-[10px] text-gray-400">TRX ID</p>
              <p className="font-bold text-xs truncate">{req.trxId}</p>
            </div>
          </div>

          {req.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(req.id, "approved")}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-black"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => updateStatus(req.id, "rejected")}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-black"
              >
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================
const AdminDashboard = ({ onBack }) => {
  const [tab, setTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "deposits",  label: "Deposits",  icon: "💰" },
    { id: "numbers",   label: "Numbers",   icon: "📱" },
    { id: "withdraws", label: "Withdraws", icon: "🏧" },
    { id: "matches",   label: "Matches",   icon: "🎮" },
    { id: "users",     label: "Users",     icon: "👥" },
  ];

  const requests       = JSON.parse(localStorage.getItem("deposit_requests") || "[]");
  const pendingCount   = requests.filter((r) => r.status === "pending").length;

  const renderContent = () => {
    switch (tab) {
      case "deposits":
        return <DepositRequests />;
      case "numbers":
        return <PaymentNumberManager />;
      case "withdraws":
        return <div className="bg-white rounded-2xl p-8 text-center shadow"><p className="text-gray-400 font-bold">🏧 Coming Soon</p></div>;
      case "matches":
        return <div className="bg-white rounded-2xl p-8 text-center shadow"><p className="text-gray-400 font-bold">🎮 Coming Soon</p></div>;
      case "users":
        return <div className="bg-white rounded-2xl p-8 text-center shadow"><p className="text-gray-400 font-bold">👥 Coming Soon</p></div>;
      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Users",      value: "0",          icon: "👥" },
              { label: "Matches",          value: "0",          icon: "🎮" },
              { label: "Total Deposits",   value: requests.length, icon: "💰" },
              { label: "Pending",          value: pendingCount, icon: "⏳" },
            ].map((card) => (
              <div key={card.label} className="bg-white p-5 rounded-2xl shadow">
                <p className="text-2xl">{card.icon}</p>
                <p className="text-gray-400 text-sm mt-1">{card.label}</p>
                <h2 className="text-2xl font-black">{card.value}</h2>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto">
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
        <button onClick={onBack}>❮</button>
        <h2 className="font-black text-lg">Admin Panel</h2>
        {pendingCount > 0 && (
          <span className="bg-orange-400 text-white text-xs font-black px-2 py-1 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>

      <div className="flex overflow-x-auto bg-white border-b">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-shrink-0 min-w-[80px] py-3 text-xs font-bold relative ${
              tab === item.id ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"
            }`}
          >
            <div>{item.icon}</div>
            <div>{item.label}</div>
            {item.id === "deposits" && pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;