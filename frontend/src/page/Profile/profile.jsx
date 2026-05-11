 import React, { useState, useEffect } from "react";
import axios from "axios";
import AddMoneyModal from "../../Component/Addmoney/AddMoney";
import Withdraw from "../../page/Withdraw/withdraw";
import BuildYourApp from "../../page/BuildYourApp/BuildYourApp";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Profile = ({ onLogout, onAllRules, onMyProfile }) => {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBuildApp, setShowBuildApp] = useState(false);
  const [balance, setBalance] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ✅ modal close এর জন্য
  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/api/users/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ auto-refresh — প্রতি ৫ সেকেন্ডে balance update
  useEffect(() => {
    let cancelled = false;

    const getBalance = async () => {
      try {
        const res = await axios.get(`${API}/api/users/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setBalance(res.data.balance || 0);
      } catch (err) {
        console.error(err);
      }
    };

    getBalance();
    const interval = setInterval(getBalance, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { id: "wallet",      label: "Wallet / Add Money", icon: "👛" },
    { id: "withdraw",    label: "Withdraw",            icon: "💵" },
    { id: "my_profile",  label: "Account Info",        icon: "👤" },
    { id: "all_rules",   label: "All Rules",           icon: "📋" },
    { id: "top_players", label: "Top Players",         icon: "📈" },
    { id: "dev_profile", label: "Build Your App",      icon: "🚀" },
  ];

  const handleNavigate = (id) => {
    if (id === "wallet")      setShowAddMoney(true);
    if (id === "withdraw")    setShowWithdraw(true);
    if (id === "all_rules")   onAllRules();
    if (id === "my_profile")  onMyProfile();
    if (id === "dev_profile") setShowBuildApp(true);
  };

  if (showBuildApp) {
    return <BuildYourApp onBack={() => setShowBuildApp(false)} />;
  }

  return (
    <div className="bg-white min-h-screen pb-10">

      {/* Header */}
      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
        <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
          👨‍💻
        </div>
        <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
        <p className="text-blue-100 text-sm mt-1">{user?.phone || ""}</p>

        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-blue-100">ব্যালেন্স</p>
          <p className="text-2xl font-black">৳ {balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="mt-4 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className="w-full flex justify-between items-center p-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex gap-4 items-center">
              <span className="text-xl">{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-8 mt-12">
        <button
          onClick={onLogout}
          className="w-full bg-blue-500 text-white py-3 rounded-full font-bold"
        >
          Logout
        </button>
      </div>

      {/* Modals */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => { setShowAddMoney(false); fetchBalance(); }}
      />
      <Withdraw
        isOpen={showWithdraw}
        onClose={() => { setShowWithdraw(false); fetchBalance(); }}
      />
    </div>
  );
};

export default Profile;