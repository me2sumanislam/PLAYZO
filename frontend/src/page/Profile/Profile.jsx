 import React from 'react';

const Profile = ({ onLogout, onNavigate }) => {
  const menuItems = [
    { id: 'wallet', label: 'Wallet', icon: '👛', color: 'text-blue-500' },
    { id: 'withdraw', label: 'Withdraw', icon: '💵', color: 'text-cyan-500' },
    { id: 'my_profile', label: 'My Profile', icon: '👤', color: 'text-blue-400' },
    { id: 'all_rules', label: 'All Rules', icon: '📋', color: 'text-teal-500', hasArrow: true },
    { id: 'top_players', label: 'Top Players', icon: '📈', color: 'text-indigo-500' },
    { id: 'dev_profile', label: 'Developer Profile', icon: '📂', color: 'text-blue-600' },
  ];

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* হেডার */}
      <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 px-6 text-center text-white">
        <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 border-4 border-white/30 flex items-center justify-center text-4xl shadow-inner">👨‍💻</div>
        <h2 className="text-xl font-bold tracking-tight">sumon2233555</h2>
        <div className="grid grid-cols-3 mt-8 items-center border-t border-white/20 pt-4">
          <div className="text-center">
            <p className="text-xl font-black">0</p>
            <p className="text-[10px] font-bold uppercase opacity-90">ম্যাচ জয়েন</p>
          </div>
          <div className="border-x border-white/20 text-center px-2">
            <p className="text-xl font-black italic uppercase">BDT 0</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">0</p>
            <p className="text-[10px] font-bold uppercase opacity-90">জিতেছেন</p>
          </div>
        </div>
      </div>

      {/* মেনু */}
      <div className="mt-4 px-2 space-y-0.5">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <span className={`text-2xl ${item.color}`}>{item.icon}</span>
              <span className="text-gray-700 font-bold text-sm">{item.label}</span>
            </div>
            {item.hasArrow && <span className="text-gray-300 text-xl">›</span>}
          </button>
        ))}
      </div>

      <div className="px-8 mt-12">
        <button onClick={onLogout} className="w-full bg-[#3B82F6] text-white py-3.5 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200">Logout</button>
      </div>
    </div>
  );
};

export default Profile;