 import React, { useState } from "react";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("matches");

  const inputStyle =
    "w-full px-6 py-5 rounded-3xl border border-gray-700 bg-transparent text-gray-300 text-lg font-bold placeholder:text-gray-500 outline-none focus:border-indigo-500 transition";

  const prizeStyle =
    "w-full px-4 py-4 rounded-2xl border border-gray-700 bg-transparent text-gray-300 text-base font-bold placeholder:text-gray-500 outline-none text-center";

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-[#111827] border-r border-white/5 p-6 shrink-0">
        <h2 className="text-2xl font-black text-orange-500 mb-8">ADMIN</h2>

        <nav className="space-y-3">
          <button
            onClick={() => setActiveTab("matches")}
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition ${
              activeTab === "matches"
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            🎮 Match Create
          </button>

          <button
            onClick={() => setActiveTab("money")}
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition ${
              activeTab === "money"
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            💰 Add Money Req
          </button>

          <button
            onClick={() => setActiveTab("withdraw")}
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition ${
              activeTab === "withdraw"
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            💸 Withdraw Req
          </button>
        </nav>
      </div>

      {/* Main Content Scroll */}
      <div className="flex-1 p-6 md:p-10 bg-[#0b1221] overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
            <h1 className="text-3xl font-black text-indigo-500">
              CREATE TOURNAMENT
            </h1>
            <span className="text-red-500 text-2xl font-bold cursor-pointer">
              X
            </span>
          </div>

          <div className="space-y-8 pb-20">
            <input type="text" placeholder="Match Name" className={inputStyle} />

            <div>
              <label className="block mb-2 text-sm font-bold text-gray-400 uppercase">
                Thumbnail
              </label>
              <div className="w-full px-6 py-5 rounded-3xl border border-gray-700 bg-transparent">
                <input type="file" className="w-full text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" placeholder="Total Win Prize" className={inputStyle} />
              <input type="text" placeholder="Entry Fee" className={inputStyle} />
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <p className="text-sm text-indigo-400 font-bold mb-4 uppercase">
                Prizes (1-5) & Per Kill
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input type="text" placeholder="1st" className={prizeStyle} />
                <input type="text" placeholder="2nd" className={prizeStyle} />
                <input type="text" placeholder="3rd" className={prizeStyle} />
                <input type="text" placeholder="4th" className={prizeStyle} />
                <input type="text" placeholder="5th" className={prizeStyle} />
                <input
                  type="text"
                  placeholder="Kill"
                  className="w-full px-4 py-4 rounded-2xl border border-orange-500 bg-transparent text-orange-400 text-base font-bold placeholder:text-orange-300 outline-none text-center"
                />
              </div>
            </div>

            <input type="text" placeholder="Date & Time" className={inputStyle} />

            <button className="w-full py-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-xl font-black tracking-wide transition shadow-xl">
              PUBLISH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;