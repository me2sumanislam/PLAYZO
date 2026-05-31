 import React, { useState, useEffect } from "react";
import axios from "axios";
import AddMoneyModal from "../../Component/Addmoney/AddMoney";
import Withdraw from "../../page/Withdraw/Withdraw";
import BuildYourApp from "../../page/BuildYourApp/BuildYourApp";
import Referral from "../../page/Referral/Referral";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com";

const Profile = ({ onLogout, onAllRules, onMyProfile }) => {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBuildApp, setShowBuildApp] = useState(false);
  const [showReferralPage, setShowReferralPage] = useState(false);
  const [balance, setBalance] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: "wallet", label: "Wallet / Add Money", icon: "👛" },
    { id: "withdraw", label: "Withdraw", icon: "💵" },
    { id: "referral", label: "Refer & Earn", icon: "🎁" },
    { id: "my_profile", label: "Account Info", icon: "👤" },
    { id: "all_rules", label: "All Rules", icon: "📋" },
    { id: "top_players", label: "Top Players", icon: "📈" },
    { id: "dev_profile", label: "Build Your App", icon: "🚀" },
  ];

  const handleNavigate = (id) => {
    if (id === "wallet") setShowAddMoney(true);
    if (id === "withdraw") setShowWithdraw(true);
    if (id === "all_rules") onAllRules();
    if (id === "my_profile") onMyProfile();
    if (id === "dev_profile") setShowBuildApp(true);
    if (id === "referral") setShowReferralPage(true);
  };

  return (
    <>
      {/* BuildYourApp Full Page */}
      {showBuildApp && (
        <BuildYourApp onBack={() => setShowBuildApp(false)} />
      )}

      {/* Referral Full Page */}
      {showReferralPage && (
        <Referral onBack={() => setShowReferralPage(false)} />
      )}

      {/* মূল Profile — BuildApp বা Referral খোলা না থাকলে দেখাবে */}
      {!showBuildApp && !showReferralPage && (
        <div className="bg-white min-h-screen pb-10">

          {/* Top Header */}
          <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
            <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl shadow-md">
              👨‍💻
            </div>
            <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
            <p className="text-blue-100 text-sm mt-1">{user?.phone || ""}</p>

            {/* Balance Card */}
            <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block backdrop-blur-sm border border-white/10">
              <p className="text-xs text-blue-100 font-medium">ব্যালেন্স</p>
              <p className="text-2xl font-black mt-0.5">
                ৳ {balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Menu List */}
          <div className="mt-4 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="w-full flex justify-between items-center p-4 border-b hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
              >
                <div className="flex gap-4 items-center">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold text-sm text-gray-800">
                    {item.label}
                  </span>
                </div>
                <span className="text-gray-400 text-lg">›</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="px-8 mt-12">
            <button
              onClick={onLogout}
              className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white py-3 rounded-full font-bold shadow-md transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Modals — সবসময় render হবে, isOpen দিয়ে control */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => {
          setShowAddMoney(false);
          fetchBalance();
        }}
      />
      <Withdraw
        isOpen={showWithdraw}
        onClose={() => {
          setShowWithdraw(false);
          fetchBalance();
        }}
      />
    </>
  );
};

export default Profile;