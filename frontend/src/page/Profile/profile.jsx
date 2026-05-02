 import React, { useState } from "react";
import AddMoneyModal from "../../Component/Addmoney/AddMoney";
import Withdraw from "../../page/withdraw/Withdraw"; // ← এই line যোগ করুন

const Profile = ({ onLogout }) => {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false); // ← এই line যোগ করুন

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuItems = [
    { id: "wallet",      label: "Wallet / Add Money", icon: "👛" },
    { id: "withdraw",    label: "Withdraw",            icon: "💵" },
    { id: "my_profile",  label: "My Profile",          icon: "👤" },
    { id: "all_rules",   label: "All Rules",            icon: "📋" },
    { id: "top_players", label: "Top Players",          icon: "📈" },
    { id: "dev_profile", label: "Developer Profile",    icon: "📂" },
  ];

  const handleNavigate = (id) => {
    if (id === "wallet")   setShowAddMoney(true);
    if (id === "withdraw") setShowWithdraw(true); // ← এই line যোগ করুন
  };

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
          <p className="text-2xl font-black">
            ৳ {localStorage.getItem("user_balance") || "0"}
          </p>
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

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => setShowAddMoney(false)}
      />

      {/* Withdraw Modal ← এই block যোগ করুন */}
      <Withdraw
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
      />

    </div>
  );
};

export default Profile;