 import React from 'react';

const MatchList = ({ matches, onBack }) => {
  return (
    <div className="bg-[#fcfaff] min-h-screen max-w-[450px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-2xl mr-4">❮</button>
        <h2 className="text-lg font-black uppercase tracking-tight">BR MATCHES</h2>
        <button className="ml-auto text-blue-500 text-xl">🔄</button>
      </div>

      {/* Match Cards Container */}
      <div className="px-3 py-4 space-y-5">
        {matches.map((match) => (
          <div key={match.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {/* Title & Banner */}
            <div className="flex gap-3 p-3">
              <div className="w-24 h-16 bg-indigo-900 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="https://via.placeholder.com/100x60/1e1b4b/ffffff?text=FREE+FIRE" alt="banner" className="object-cover" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-800 leading-tight">
                  {match.title} | {match.version} | {match.type}
                </h3>
                <p className="text-[10px] text-red-500 font-bold mt-1">{match.time}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-y-4 px-4 py-2 border-t border-gray-50 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Win Prize</p>
                <p className="text-xs font-black">{match.winPrize} TK</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Entry Type</p>
                <p className="text-xs font-black">{match.entryType}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Entry Fee</p>
                <p className="text-xs font-black">{match.entryFee} TK</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Per Kill</p>
                <p className="text-xs font-black">{match.perKill} TK</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Map</p>
                <p className="text-xs font-black">{match.mapName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Version</p>
                <p className="text-xs font-black">{match.version}</p>
              </div>
            </div>

            {/* Progress Bar & Join Button */}
            <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-50">
              <div className="flex-1">
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full" 
                    style={{ width: `${(match.joined / match.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-[9px] text-gray-400 font-bold">Only {match.total - match.joined} spots left</p>
                  <p className="text-[9px] text-gray-600 font-black">{match.joined}/{match.total}</p>
                </div>
              </div>
              <button className={`px-4 py-2 rounded-lg border-2 font-black text-xs ${match.joined >= match.total ? 'border-gray-200 text-gray-400' : 'border-indigo-600 text-indigo-600 active:bg-indigo-50'}`}>
                {match.joined >= match.total ? 'Match Full' : 'Join Now'}
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-2 px-3 py-3 bg-gray-50">
               <button className="bg-white border border-indigo-200 text-indigo-700 py-1.5 rounded-md text-[10px] font-black uppercase flex items-center justify-center gap-1">
                 🔑 Room Details <span>▼</span>
               </button>
               <button className="bg-white border border-indigo-200 text-indigo-700 py-1.5 rounded-md text-[10px] font-black uppercase flex items-center justify-center gap-1">
                 🏆 Total Prize Details <span>▼</span>
               </button>
            </div>

            {/* Starts In Timer */}
            <div className="bg-green-600 text-white text-center py-2 text-xs font-bold flex items-center justify-center gap-2">
              🕒 STARTS IN - <span className="text-sm font-black">{match.startsIn}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchList;