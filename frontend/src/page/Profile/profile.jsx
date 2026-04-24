 import React from "react";

const Profile = ({ onLogout, onNavigate, activeTab }) => {
  const menuItems = [
    { id: "wallet", label: "Wallet", icon: "👛" },
    { id: "withdraw", label: "Withdraw", icon: "💵" },
    { id: "my_profile", label: "My Profile", icon: "👤" },
    { id: "all_rules", label: "All Rules", icon: "📋", hasArrow: true },
    { id: "top_players", label: "Top Players", icon: "📈" },
    { id: "dev_profile", label: "Developer Profile", icon: "📂" },
  ];

  return (
    <div className="bg-white min-h-screen pb-10">

      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
        <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
          👨‍💻
        </div>

        <h2 className="text-xl font-bold">sumon2233555</h2>
      </div>

      <div className="mt-4 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}   // ✅ THIS IS THE FIX
            className="w-full flex justify-between p-4 border-b"
          >
            <div className="flex gap-4">
              <span>{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            {item.hasArrow && <span>›</span>}
          </button>
        ))}
      </div>

      <div className="px-8 mt-12">
        <button
          onClick={onLogout}
          className="w-full bg-blue-500 text-white py-3 rounded-full font-bold"
        >
          Logout
        </button>
      </div>

    </div>
  );
};

export default Profile;