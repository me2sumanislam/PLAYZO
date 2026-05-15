 import React from 'react';

const AppDashboard = () => {
  // টুর্নামেন্ট ডাটা (ভবিষ্যতে আপনি এটি MongoDB থেকে fetch করবেন)
  const games = [
    { id: 1, title: 'BR MATCH', matches: '21 matches found', img: 'https://via.placeholder.com/300x150/222/fff?text=BR+Match' },
    { id: 2, title: 'BR SURVIVAL', matches: '13 matches found', img: 'https://via.placeholder.com/300x150/444/fff?text=Survival' },
    { id: 3, title: 'Clash Squad', matches: '24 matches found', img: 'https://via.placeholder.com/300x150/666/fff?text=Clash+Squad' },
    { id: 4, title: 'CS 2 VS 2', matches: '29 matches found', img: 'https://via.placeholder.com/300x150/888/fff?text=2vs2' },
  ];

  return (
    <div className="bg-[#f3f4f6] min-h-screen max-w-[450px] mx-auto border-x border-gray-200 relative pb-24 shadow-2xl overflow-y-auto">
      
      {/* --- Top Banner Section (As per your image) --- */}
      <div className="bg-black p-5 relative overflow-hidden h-44 flex items-center justify-between rounded-b-[2.5rem]">
        <div className="z-10">
          <h2 className="text-[#a3ff00] font-black text-2xl italic leading-tight">DAILY</h2>
          <h2 className="text-white font-black text-2xl leading-tight">WITHDRAW</h2>
          <h2 className="text-cyan-400 font-black text-2xl leading-tight">PROOF</h2>
        </div>
        
        <div className="bg-white p-2 rounded-xl z-10 w-20 h-20 flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-black text-black border-b border-black leading-none">KHELO</span>
          <span className="text-[8px] font-bold text-gray-500">BANGLADESH</span>
          <span className="text-[10px] font-black text-green-600">OFFICIAL</span>
        </div>

        {/* Orange Curve Background Element */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-orange-500 rounded-l-full translate-x-8 opacity-90"></div>
      </div>

      {/* --- Notice / Withdraw Bar --- */}
      <div className="bg-white py-2 px-4 flex justify-between items-center shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-orange-500 text-[11px] font-bold whitespace-nowrap animate-pulse">
            📢 পরে পেয়ে যাবে সবাই। আমাদের সাথেই থাকুন।
          </span>
        </div>
        <button className="text-orange-600 text-xs font-black uppercase italic whitespace-nowrap ml-2">
          Withdraw +
        </button>
      </div>

      {/* --- Game Category Title --- */}
      <div className="text-center my-5">
        <h3 className="text-gray-500 font-black tracking-[0.4em] text-sm uppercase">FREE FIRE</h3>
      </div>

      {/* --- Tournament Grid (2 Columns) --- */}
      <div className="grid grid-cols-2 gap-4 px-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-all">
            <div className="h-28 relative">
              <img src={game.img} alt={game.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-black text-[10px] italic text-center px-1 uppercase leading-tight drop-shadow-md">
                  {game.title}
                </span>
              </div>
            </div>
            <div className="p-3 bg-white">
              <h4 className="font-bold text-xs text-slate-800 truncate">{game.title}</h4>
              <p className="text-[9px] text-gray-400 font-semibold">{game.matches}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- Bottom Navigation Menu --- */}
      <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center gap-1 text-cyan-500 cursor-pointer">
          <span className="text-xl">🏪</span>
          <span className="text-[9px] font-bold">Shop</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-indigo-700 cursor-pointer scale-110">
          <div className="bg-indigo-50 p-1 px-3 rounded-xl border border-indigo-100">
            <span className="text-xl">🎮</span>
          </div>
          <span className="text-[9px] font-black">Play</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer">
          <span className="text-xl">📋</span>
          <span className="text-[9px] font-bold">My Matches</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-green-500 cursor-pointer">
          <span className="text-xl">📈</span>
          <span className="text-[9px] font-bold">Results</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-purple-500 cursor-pointer">
          <span className="text-xl">👤</span>
          <span className="text-[9px] font-bold">Profile</span>
        </div>
      </div>

    </div>
  );
};

export default AppDashboard;